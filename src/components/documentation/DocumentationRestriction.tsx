import React from 'react';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {AlertTriangle, Lock} from "lucide-react";
import {Link} from 'react-router-dom';

interface DocumentationRestrictionProps {
  type: 'consultations' | 'template';
  templateName?: string;
  tier?: string;
  onClose?: () => void;
}

export default function DocumentationRestriction({ 
  type, 
  templateName, 
  tier,
  onClose
}: DocumentationRestrictionProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <CardTitle>
            {type === 'consultations' ? 'No Consultations Remaining' : 'Template Restricted'}
          </CardTitle>
        </div>
        <CardDescription>
          {type === 'consultations' 
            ? 'You have used all your available consultations for this period.' 
            : `The ${templateName} template requires a higher subscription tier.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-amber-800">
          <div className="flex items-start">
            <Lock className="h-5 w-5 mt-0.5 mr-2" />
            <div>
              {type === 'consultations' ? (
                <p>
                  To continue creating documentation, you can either:
                  <ul className="list-disc pl-5 mt-2">
                    <li>Purchase additional consultations</li>
                    <li>Upgrade your subscription plan</li>
                  </ul>
                </p>
              ) : (
                <p>
                  This template is available on the {tier || 'higher tier'} plan and above.
                  To access this template, please upgrade your subscription.
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button asChild>
          <Link to={type === 'consultations' ? '/consultation-purchase' : '/pricing'}>
            {type === 'consultations' ? 'Buy More Consultations' : 'View Pricing'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
