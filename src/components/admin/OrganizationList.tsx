import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, CreditCard, BarChart, RefreshCw, Eye, Copy } from "lucide-react";
import { toast } from "sonner";

interface Organization {
  id: string;
  name: string;
  contact_email: string;
  contact_name: string;
  industry: string;
  credits_remaining: number;
  rate_limit_per_hour: number;
  api_key: string;
  allowed_document_types: string[];
  created_at: string;
  last_activity: string;
  total_requests: number;
  is_active: boolean;
}

interface OrganizationListProps {
  organizations: Organization[];
  isLoading: boolean;
  onManageCredits: (organization: Organization) => void;
  onViewUsage: (organization: Organization) => void;
  onRotateKey: (organization: Organization) => void;
}

export function OrganizationList({
  organizations,
  isLoading,
  onManageCredits,
  onViewUsage,
  onRotateKey
}: OrganizationListProps) {
  
  const copyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    toast.success('API key copied to clipboard');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-12 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No organizations found</p>
        <p className="text-sm text-muted-foreground mt-1">Create your first organization to get started</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Organization</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Industry</TableHead>
          <TableHead>Credits</TableHead>
          <TableHead>Rate Limit</TableHead>
          <TableHead>Requests</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Last Activity</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {organizations.map((org) => (
          <TableRow key={org.id}>
            <TableCell>
              <div>
                <div className="font-medium">{org.name}</div>
                <div className="text-sm text-muted-foreground">
                  {org.allowed_document_types.length} document types
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div>
                <div className="font-medium">{org.contact_name}</div>
                <div className="text-sm text-muted-foreground">{org.contact_email}</div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{org.industry}</Badge>
            </TableCell>
            <TableCell>
              <div className="text-right">
                <div className="font-medium">{org.credits_remaining.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">remaining</div>
              </div>
            </TableCell>
            <TableCell>
              <div className="text-right">
                <div className="font-medium">{org.rate_limit_per_hour.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">per hour</div>
              </div>
            </TableCell>
            <TableCell>
              <div className="text-right">
                <div className="font-medium">{org.total_requests.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">total</div>
              </div>
            </TableCell>
            <TableCell>
              {org.is_active ? (
                <Badge variant="success">Active</Badge>
              ) : (
                <Badge variant="destructive">Inactive</Badge>
              )}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatDate(org.created_at)}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {org.last_activity ? formatDateTime(org.last_activity) : 'Never'}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onViewUsage(org)}>
                    <BarChart className="h-4 w-4 mr-2" />
                    View Usage Stats
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onManageCredits(org)}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manage Credits
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => copyApiKey(org.api_key)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy API Key
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onRotateKey(org)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Rotate API Key
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
