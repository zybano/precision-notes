import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, AlertTriangle, Copy, Eye, EyeOff, Key } from "lucide-react";
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

interface RotateKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization;
  onRotateKey: (organizationId: string) => Promise<string>;
}

export function RotateKeyDialog({
  open,
  onOpenChange,
  organization,
  onRotateKey
}: RotateKeyDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [showCurrentKey, setShowCurrentKey] = useState(false);
  const [showNewKey, setShowNewKey] = useState(false);

  const handleRotateKey = async () => {
    setIsLoading(true);
    try {
      const newKey = await onRotateKey(organization.id);
      setNewApiKey(newKey);
      toast.success('API key rotated successfully');
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formatApiKey = (key: string, show: boolean) => {
    if (show) return key;
    if (key.length <= 8) return '••••••••';
    return `${key.substring(0, 4)}••••••••${key.substring(key.length - 4)}`;
  };

  const handleClose = () => {
    setNewApiKey(null);
    setShowCurrentKey(false);
    setShowNewKey(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <RefreshCw className="h-5 w-5 mr-2" />
            Rotate API Key
          </DialogTitle>
          <DialogDescription>
            Generate a new API key for {organization.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Card */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-orange-800">
                    Important: Key Rotation Impact
                  </p>
                  <p className="text-xs text-orange-700">
                    Rotating the API key will immediately invalidate the current key. 
                    Make sure to update all integrations with the new key to avoid service disruption.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current API Key */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Key className="h-4 w-4 mr-2" />
                Current API Key
              </CardTitle>
              <CardDescription>
                The key currently in use by this organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="current-key">Current Key</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="current-key"
                    value={formatApiKey(organization.api_key, showCurrentKey)}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCurrentKey(!showCurrentKey)}
                  >
                    {showCurrentKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(organization.api_key, 'Current API key')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <div className="font-medium">
                    {new Date(organization.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Activity:</span>
                  <div className="font-medium">
                    {organization.last_activity ? 
                      new Date(organization.last_activity).toLocaleDateString() : 
                      'Never'
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* New API Key (after rotation) */}
          {newApiKey && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-green-800">
                  <Key className="h-4 w-4 mr-2" />
                  New API Key Generated!
                </CardTitle>
                <CardDescription>
                  Your new API key is ready. Make sure to copy it now as you won't be able to see it again.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="new-key">New Key</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="new-key"
                      value={formatApiKey(newApiKey, showNewKey)}
                      readOnly
                      className="font-mono text-sm bg-green-100 border-green-300"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewKey(!showNewKey)}
                      className="border-green-300"
                    >
                      {showNewKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(newApiKey, 'New API key')}
                      className="border-green-300"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 p-3 bg-green-100 rounded-lg">
                  <Badge variant="secondary" className="bg-green-200 text-green-800">
                    Active
                  </Badge>
                  <span className="text-sm text-green-700">
                    This key is now active and ready for use
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Organization Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Organization Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <div className="font-medium">{organization.name}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Industry:</span>
                  <div className="font-medium">{organization.industry}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Rate Limit:</span>
                  <div className="font-medium">{organization.rate_limit_per_hour}/hour</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Requests:</span>
                  <div className="font-medium">{organization.total_requests.toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            {newApiKey ? 'Close' : 'Cancel'}
          </Button>
          {!newApiKey && (
            <Button 
              type="button" 
              onClick={handleRotateKey} 
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <RefreshCw className="h-4 w-4 mr-2" />
              Rotate API Key
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
