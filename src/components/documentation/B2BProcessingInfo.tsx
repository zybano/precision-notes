import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CreditCard, Building2 } from "lucide-react";

interface B2BProcessingInfoProps {
  creditsUsed?: number;
  processingTimeMs?: number;
  organizationId?: string;
  requestId?: string;
}

const B2BProcessingInfo: React.FC<B2BProcessingInfoProps> = ({
  creditsUsed,
  processingTimeMs,
  organizationId,
  requestId
}) => {
  if (!creditsUsed && !processingTimeMs && !organizationId) {
    return null;
  }

  return (
    <Card className="bg-muted/50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center">
          <Building2 className="h-4 w-4 mr-2" />
          Processing Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {creditsUsed && (
            <Badge variant="secondary" className="flex items-center">
              <CreditCard className="h-3 w-3 mr-1" />
              {creditsUsed} credits used
            </Badge>
          )}
          {processingTimeMs && (
            <Badge variant="secondary" className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {(processingTimeMs / 1000).toFixed(1)}s processing
            </Badge>
          )}
        </div>
        {organizationId && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Organization ID:</span> {organizationId}
          </div>
        )}
        {requestId && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Request ID:</span> {requestId}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default B2BProcessingInfo;