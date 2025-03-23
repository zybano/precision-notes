
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Ambulance, AlertTriangle } from "lucide-react";

export interface AmbulanceUnit {
  id: number;
  unit: string;
  status: 'available' | 'dispatched' | 'returning';
  crew: string;
  location?: string;
  dispatchTime?: string;
}

interface AmbulanceManagerProps {
  ambulances: AmbulanceUnit[];
  onDispatchAmbulance: (id: number) => void;
  onReturnAmbulance: (id: number) => void;
}

export const AmbulanceManager = ({ 
  ambulances, 
  onDispatchAmbulance, 
  onReturnAmbulance 
}: AmbulanceManagerProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ambulance Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Emergency Number</AlertTitle>
            <AlertDescription>
              For emergencies, call 911. Ambulance dispatch: 555-1234
            </AlertDescription>
          </Alert>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Crew</TableHead>
              <TableHead className="hidden md:table-cell">Location/Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ambulances.map((ambulance) => (
              <TableRow key={ambulance.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <Ambulance className="h-4 w-4 mr-2 text-red-500" />
                    {ambulance.unit}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      ambulance.status === 'available' ? 'default' :
                      ambulance.status === 'dispatched' ? 'destructive' :
                      'secondary'
                    }
                  >
                    {ambulance.status.charAt(0).toUpperCase() + ambulance.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>{ambulance.crew}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {ambulance.status !== 'available' 
                    ? ambulance.location || 'N/A' + ' - ' + (ambulance.dispatchTime || 'N/A')
                    : 'At station'
                  }
                </TableCell>
                <TableCell className="text-right">
                  {ambulance.status === 'available' && (
                    <Button size="sm" variant="outline" onClick={() => onDispatchAmbulance(ambulance.id)}>
                      Dispatch
                    </Button>
                  )}
                  {ambulance.status === 'dispatched' && (
                    <Button size="sm" variant="outline" onClick={() => onReturnAmbulance(ambulance.id)}>
                      Mark Returned
                    </Button>
                  )}
                  {ambulance.status === 'returning' && (
                    <Button size="sm" variant="outline" onClick={() => onReturnAmbulance(ambulance.id)}>
                      Arrived at Station
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
