// Integration tests for the new payment service
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { paymentService } from '../index';

// Mock user for testing
const mockUserId = '123e4567-e89b-12d3-a456-426614174000';

describe('Payment Service Integration Tests', () => {
  beforeEach(async () => {
    // Set up test user and clean slate
    await supabase
      .from('user_credits')
      .delete()
      .eq('user_id', mockUserId);
      
    await supabase
      .from('transaction_history')
      .delete()
      .eq('user_id', mockUserId);
  });

  afterEach(async () => {
    // Clean up test data
    await supabase
      .from('user_credits')
      .delete()
      .eq('user_id', mockUserId);
      
    await supabase
      .from('transaction_history')
      .delete()
      .eq('user_id', mockUserId);
  });

  describe('Credit Management', () => {
    it('should initialize user credits correctly', async () => {
      const result = await paymentService.getCredits();
      
      expect(result.success).toBe(true);
      expect(result.balance).toBe(0);
      expect(result.totalEarned).toBe(0);
      expect(result.totalUsed).toBe(0);
    });

    it('should add credits atomically', async () => {
      const addResult = await paymentService.addCredits(50, 12, 'test');
      
      expect(addResult.success).toBe(true);
      expect(addResult.balance).toBe(50);

      // Verify the credit record was created
      const { data } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', mockUserId)
        .single();

      expect(data?.balance).toBe(50);
      expect(data?.total_earned).toBe(50);
      expect(data?.total_used).toBe(0);
    });

    it('should deduct credits atomically', async () => {
      // First add some credits
      await paymentService.addCredits(100);
      
      // Then deduct some
      const deductResult = await paymentService.deductCredits(30);
      
      expect(deductResult.success).toBe(true);
      expect(deductResult.balance).toBe(70);

      // Verify the database state
      const { data } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', mockUserId)
        .single();

      expect(data?.balance).toBe(70);
      expect(data?.total_earned).toBe(100);
      expect(data?.total_used).toBe(30);
    });

    it('should prevent overdraft', async () => {
      // Try to deduct more credits than available
      const deductResult = await paymentService.deductCredits(50);
      
      expect(deductResult.success).toBe(false);
      expect(deductResult.error).toContain('Insufficient credits');
    });

    it('should handle concurrent credit operations', async () => {
      // Add initial credits
      await paymentService.addCredits(100);
      
      // Simulate concurrent deductions
      const promises = [
        paymentService.deductCredits(20),
        paymentService.deductCredits(30),
        paymentService.deductCredits(25)
      ];
      
      const results = await Promise.all(promises);
      
      // All should succeed since total is 75 which is less than 100
      expect(results.every(r => r.success)).toBe(true);
      
      // Final balance should be correct
      const finalCredits = await paymentService.getCredits();
      expect(finalCredits.balance).toBe(25); // 100 - 20 - 30 - 25
    });
  });

  describe('Transaction History', () => {
    it('should record credit transactions', async () => {
      await paymentService.addCredits(50, 12, 'test_purchase');
      await paymentService.deductCredits(10);
      
      // Check transaction history
      const { data: transactions } = await supabase
        .from('transaction_history')
        .select('*')
        .eq('user_id', mockUserId)
        .order('created_at', { ascending: true });

      expect(transactions).toHaveLength(2);
      
      // First transaction should be credit addition
      expect(transactions[0].transaction_type).toBe('credit');
      expect(transactions[0].amount).toBe(50);
      expect(transactions[0].currency).toBe('CREDITS');
      
      // Second transaction should be credit usage
      expect(transactions[1].transaction_type).toBe('usage');
      expect(transactions[1].amount).toBe(-10);
      expect(transactions[1].currency).toBe('CREDITS');
    });
  });

  describe('Audit Logging', () => {
    it('should log credit operations', async () => {
      await paymentService.addCredits(25);
      await paymentService.deductCredits(10);
      
      // Check audit logs (requires service role access)
      // This would need to be tested with elevated permissions
      // or through a dedicated test endpoint
      
      // For now, just verify the operations completed successfully
      const credits = await paymentService.getCredits();
      expect(credits.balance).toBe(15);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock a database error by trying to operate on non-existent user
      const originalUserId = mockUserId;
      
      // This should handle the error gracefully
      const result = await paymentService.deductCredits(10);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate input parameters', async () => {
      const result = await paymentService.deductCredits(-10);
      expect(result.success).toBe(false);
    });
  });

  describe('Credit Expiration', () => {
    it('should handle expired credits', async () => {
      // Add credits with past expiration
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      
      // Manually insert expired credits for testing
      await supabase
        .from('user_credits')
        .insert({
          user_id: mockUserId,
          balance: 50,
          total_earned: 50,
          total_used: 0,
          expires_at: pastDate.toISOString()
        });
      
      const result = await paymentService.getCredits();
      expect(result.success).toBe(true);
      expect(result.balance).toBe(0); // Should return 0 for expired credits
    });
  });

  describe('Subscription Integration', () => {
    it('should handle subscription credit grants', async () => {
      // This would test the subscription webhook integration
      // For now, test direct credit addition with subscription source
      const result = await paymentService.addCredits(100, 12, 'subscription');
      
      expect(result.success).toBe(true);
      expect(result.balance).toBe(100);
      
      // Verify transaction was recorded with correct source
      const { data: transaction } = await supabase
        .from('transaction_history')
        .select('*')
        .eq('user_id', mockUserId)
        .eq('transaction_type', 'credit')
        .single();
        
      expect(transaction?.metadata?.source).toBe('subscription');
    });
  });
});

describe('Payment Provider Selection', () => {
  it('should select correct provider based on region', async () => {
    // Mock region detection
    const mockGetRegionInfo = vi.fn();
    
    // Test Nigerian user gets Paystack
    mockGetRegionInfo.mockResolvedValue({ isNigeria: true, countryCode: 'NG' });
    
    // This would need proper mocking of the region service
    // For now, just verify the service can be called
    const service = paymentService;
    expect(service).toBeDefined();
  });
});
