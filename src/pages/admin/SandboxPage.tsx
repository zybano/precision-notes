import {useEffect, useMemo, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Switch} from '@/components/ui/switch';
import {Textarea} from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import {adminApiService} from '@/services/adminApiService';
import PlatformModuleHeader from '@/components/admin/PlatformModuleHeader';
import AdminFormField from '@/components/admin/AdminFormField';
import TranscriptionSettings from '@/components/documentation/TranscriptionSettings';
import {TranscriptionLanguage} from '@/hooks/useDocumentFormat';
import {toast} from 'sonner';

const providers = ['ASSEMBLY_AI', 'DEEPGRAM', 'GOOGLE'] as const;

type ProviderType = (typeof providers)[number];
type ProviderConfigRow = {
  provider: ProviderType;
  enabled: boolean;
  supportsUploadedMedia: boolean;
  supportsLive: boolean;
  liveTransport?: string;
};

export default function SandboxPage() {
  const { sessionToken } = useAdminAuth();
  const queryClient = useQueryClient();

  const [defaultProvider, setDefaultProvider] = useState<ProviderType>('ASSEMBLY_AI');
  const [liveSessionPayload, setLiveSessionPayload] = useState({
    provider: 'ASSEMBLY_AI',
    expiresInSeconds: 1800,
    maxSessionDurationSeconds: 3600,
    languageCode: 'en-US',
  });
  const [sessionIdLookup, setSessionIdLookup] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [failoverPayload, setFailoverPayload] = useState({
    currentProvider: 'ASSEMBLY_AI',
    fallbackProvider: 'DEEPGRAM',
    languageCode: 'en-US',
  });
  const [webhookPayload, setWebhookPayload] = useState({
    targetUrl: 'https://example.org/sandbox/webhook',
    eventType: 'transcription.completed',
    payload: '{"test":true}',
  });
  const [transcriptionPayload, setTranscriptionPayload] = useState({
    provider: 'ASSEMBLY_AI',
    languageCode: 'en-US',
    useSpeechModelNano: false,
    requestId: '',
  });
  const [acceptSuggestions, setAcceptSuggestions] = useState(false);

  const toTranscriptionLanguage = (value: string): TranscriptionLanguage => {
    switch (value.toLowerCase()) {
      case 'yo':
      case 'yoruba':
        return TranscriptionLanguage.YORUBA;
      case 'ha':
      case 'hausa':
        return TranscriptionLanguage.HAUSA;
      default:
        return TranscriptionLanguage.ENGLISH;
    }
  };

  const fromTranscriptionLanguage = (value: TranscriptionLanguage): string => {
    switch (value) {
      case TranscriptionLanguage.YORUBA:
        return 'yo';
      case TranscriptionLanguage.HAUSA:
        return 'ha';
      default:
        return 'en-US';
    }
  };

  const sandboxCapabilitiesQuery = useQuery({
    queryKey: ['sandbox', 'capabilities'],
    enabled: Boolean(sessionToken),
    queryFn: async () => {
      const response = await adminApiService.getPlatformSandboxCapabilities(sessionToken as string);
      if (!response.success) throw new Error(response.error || 'Failed to load sandbox capabilities');
      return response.data as {
        defaultProvider?: ProviderType;
        enabledProviders?: ProviderType[];
        supportedLanguageCount?: number;
        supportedLanguageCodes?: string[];
      };
    },
  });

  const providerConfigQuery = useQuery({
    queryKey: ['sandbox', 'provider-config'],
    enabled: Boolean(sessionToken),
    queryFn: async () => {
      const response = await adminApiService.getTranscriptionProviderConfig(sessionToken as string);
      if (!response.success) throw new Error(response.error || 'Failed to load provider config');
      return response.data as {
        defaultProvider: ProviderType;
        providers: ProviderConfigRow[];
      };
    },
  });

  const languagesQuery = useQuery({
    queryKey: ['sandbox', 'languages'],
    enabled: Boolean(sessionToken),
    queryFn: async () => {
      const response = await adminApiService.getSupportedTranscriptionLanguages(sessionToken as string);
      if (!response.success) throw new Error(response.error || 'Failed to load languages');
      return response.data as {
        canonicalLanguages?: Array<{ code: string; name?: string }>;
      };
    },
  });

  const providerRows = useMemo(() => providerConfigQuery.data?.providers || [], [providerConfigQuery.data]);
  const languageRows = useMemo(() => languagesQuery.data?.canonicalLanguages || [], [languagesQuery.data]);

  useEffect(() => {
    if (providerConfigQuery.data?.defaultProvider) {
      setDefaultProvider(providerConfigQuery.data.defaultProvider);
    }
  }, [providerConfigQuery.data?.defaultProvider]);

  const updateProviderConfigMutation = useMutation({
    mutationFn: async (updatedRows: typeof providerRows) => {
      const response = await adminApiService.updateTranscriptionProviderConfig(sessionToken as string, {
        defaultProvider,
        providers: updatedRows.map((row) => ({
          provider: row.provider,
          enabled: row.enabled,
          supportsUploadedMedia: row.supportsUploadedMedia,
          supportsLive: row.supportsLive,
          liveTransport: row.liveTransport,
          config: {},
        })),
      });
      if (!response.success) throw new Error(response.error || 'Failed to update provider config');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Provider config updated');
      providerConfigQuery.refetch();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleProviderEnabledMutation = useMutation({
    mutationFn: async ({ provider, enabled }: { provider: ProviderType; enabled: boolean }) => {
      const nextRows = providerRows.map((row) =>
        row.provider === provider ? { ...row, enabled } : row
      );

      let nextDefaultProvider = defaultProvider;
      if (!enabled && provider === defaultProvider) {
        const fallbackProvider = nextRows.find((row) => row.enabled)?.provider;
        if (!fallbackProvider) {
          throw new Error('At least one provider must remain enabled');
        }
        nextDefaultProvider = fallbackProvider;
      }

      const response = await adminApiService.updateTranscriptionProviderConfig(sessionToken as string, {
        defaultProvider: nextDefaultProvider,
        providers: nextRows.map((row) => ({
          provider: row.provider,
          enabled: row.enabled,
          supportsUploadedMedia: row.supportsUploadedMedia,
          supportsLive: row.supportsLive,
          liveTransport: row.liveTransport,
          config: {},
        })),
      });

      if (!response.success) throw new Error(response.error || 'Failed to update provider state');
      return { provider, enabled, defaultProvider: nextDefaultProvider };
    },
    onMutate: async ({ provider, enabled }) => {
      await queryClient.cancelQueries({ queryKey: ['sandbox', 'provider-config'] });

      const previousConfig = queryClient.getQueryData<{
        defaultProvider: ProviderType;
        providers: ProviderConfigRow[];
      }>(['sandbox', 'provider-config']);
      const previousDefaultProvider = defaultProvider;

      if (previousConfig) {
        const optimisticRows = previousConfig.providers.map((row) =>
          row.provider === provider ? { ...row, enabled } : row
        );

        let optimisticDefaultProvider = previousConfig.defaultProvider;
        if (!enabled && provider === previousConfig.defaultProvider) {
          optimisticDefaultProvider =
            optimisticRows.find((row) => row.enabled)?.provider || previousConfig.defaultProvider;
          setDefaultProvider(optimisticDefaultProvider);
        }

        queryClient.setQueryData(['sandbox', 'provider-config'], {
          ...previousConfig,
          defaultProvider: optimisticDefaultProvider,
          providers: optimisticRows,
        });
      }

      return { previousConfig, previousDefaultProvider };
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previousConfig) {
        queryClient.setQueryData(['sandbox', 'provider-config'], context.previousConfig);
      }
      if (context?.previousDefaultProvider) {
        setDefaultProvider(context.previousDefaultProvider);
      }
      toast.error(error.message);
    },
    onSuccess: (data) => {
      setDefaultProvider(data.defaultProvider);
      toast.success(`${data.provider} ${data.enabled ? 'enabled' : 'disabled'}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['sandbox', 'provider-config'] });
      queryClient.invalidateQueries({ queryKey: ['sandbox', 'capabilities'] });
    },
  });

  const liveSessionCreateMutation = useMutation({
    mutationFn: async () => {
      const response = await adminApiService.createPlatformLiveSession(sessionToken as string, {
        provider: liveSessionPayload.provider,
        expiresInSeconds: Number(liveSessionPayload.expiresInSeconds),
        maxSessionDurationSeconds: Number(liveSessionPayload.maxSessionDurationSeconds),
        languageCode: liveSessionPayload.languageCode,
      });
      if (!response.success) throw new Error(response.error || 'Failed to create live session');
      return response.data as { sessionId?: string; token?: string; websocketUrl?: string };
    },
    onSuccess: (data) => {
      toast.success(data?.sessionId ? `Live session created: ${data.sessionId}` : 'Live session created');
      if (data?.sessionId) {
        setSessionIdLookup(data.sessionId);
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const liveSessionStatusQuery = useQuery({
    queryKey: ['sandbox', 'live-session-status', sessionIdLookup],
    enabled: false,
    queryFn: async () => {
      const response = await adminApiService.getPlatformLiveSession(sessionToken as string, sessionIdLookup);
      if (!response.success) throw new Error(response.error || 'Failed to load live session status');
      return response.data as Record<string, unknown>;
    },
  });

  const transcriptionMutation = useMutation({
    mutationFn: async () => {
      if (!audioFile) {
        throw new Error('Audio file is required');
      }
      const response = await adminApiService.createPlatformTranscription(sessionToken as string, {
        audioFile,
        provider: transcriptionPayload.provider,
        languageCode: transcriptionPayload.languageCode || undefined,
        useSpeechModelNano: transcriptionPayload.useSpeechModelNano,
        requestId: transcriptionPayload.requestId || undefined,
      });
      if (!response.success) throw new Error(response.error || 'Failed to transcribe audio');
      return response.data as { transcript?: string; text?: string; provider?: string };
    },
    onSuccess: () => {
      toast.success('Transcription test completed');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const failoverSimulationMutation = useMutation({
    mutationFn: async () => {
      const response = await adminApiService.simulateProviderFailover(sessionToken as string, {
        currentProvider: failoverPayload.currentProvider,
        fallbackProvider: failoverPayload.fallbackProvider,
        languageCode: failoverPayload.languageCode || undefined,
      });
      if (!response.success) throw new Error(response.error || 'Failed to run failover simulation');
      return response.data as {
        canFailover: boolean;
        currentProvider: string;
        recommendedProvider?: string;
        languageCode?: string;
        message: string;
      };
    },
    onSuccess: (data) => {
      toast.success(data?.canFailover ? 'Failover simulation passed' : 'Failover simulation completed with warnings');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const webhookTestMutation = useMutation({
    mutationFn: async () => {
      const response = await adminApiService.createSandboxWebhookTest(sessionToken as string, {
        targetUrl: webhookPayload.targetUrl,
        eventType: webhookPayload.eventType,
        payload: webhookPayload.payload || undefined,
      });
      if (!response.success) throw new Error(response.error || 'Failed to create webhook test');
      return response.data as {
        eventId: string;
        targetUrl: string;
        eventType: string;
        accepted: boolean;
        message: string;
        requestedAt: string;
      };
    },
    onSuccess: () => {
      toast.success('Webhook test request created');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!sessionToken) {
    return (
      <div>
        <PlatformModuleHeader
          title="Sandbox"
          description="Safe environment for testing providers, transcription settings, and language options."
        />
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            Sign in as platform admin to use sandbox tools.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PlatformModuleHeader
        title="Sandbox"
        description="Safe environment for testing providers, transcription settings, and language options."
      />

      <div className="grid gap-4 mb-6 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Providers</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{providerRows.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Default Provider</CardTitle></CardHeader>
          <CardContent className="text-lg font-semibold">{providerConfigQuery.data?.defaultProvider || '-'}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Languages</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{languageRows.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Audio Test</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">Upload + provider-run</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Enabled Providers</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{sandboxCapabilitiesQuery.data?.enabledProviders?.length ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Capabilities API</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {sandboxCapabilitiesQuery.isLoading ? 'Loading...' : 'Live endpoint wired'}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Provider Configuration</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Default:</span>
              <Select value={defaultProvider} onValueChange={(value) => setDefaultProvider(value as ProviderType)}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={() => updateProviderConfigMutation.mutate(providerRows)}
                disabled={providerRows.length === 0 || updateProviderConfigMutation.isPending}
              >
                {updateProviderConfigMutation.isPending ? 'Saving...' : 'Save Config'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead>Uploaded Media</TableHead>
                  <TableHead>Live</TableHead>
                  <TableHead>Transport</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providerConfigQuery.isLoading && <TableRow><TableCell colSpan={5}>Loading config...</TableCell></TableRow>}
                {providerRows.map((row) => (
                  <TableRow key={row.provider}>
                    <TableCell className="font-medium">{row.provider}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={row.enabled}
                          disabled={toggleProviderEnabledMutation.isPending}
                          onCheckedChange={(checked) => {
                            const enabledCount = providerRows.filter((providerRow) => providerRow.enabled).length;
                            if (!checked && row.enabled && enabledCount <= 1) {
                              toast.error('At least one provider must remain enabled');
                              return;
                            }
                            toggleProviderEnabledMutation.mutate({ provider: row.provider, enabled: checked });
                          }}
                        />
                        <Badge variant={row.enabled ? 'default' : 'secondary'}>{row.enabled ? 'Enabled' : 'Disabled'}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>{row.supportsUploadedMedia ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{row.supportsLive ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{row.liveTransport || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live Session Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              <AdminFormField label="Provider" htmlFor="sandbox-live-provider">
                <Select value={liveSessionPayload.provider} onValueChange={(value) => setLiveSessionPayload((prev) => ({ ...prev, provider: value }))}>
                  <SelectTrigger id="sandbox-live-provider"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </AdminFormField>
              <AdminFormField label="Expires (sec)" htmlFor="sandbox-live-expires">
                <Input id="sandbox-live-expires" type="number" value={liveSessionPayload.expiresInSeconds} onChange={(e) => setLiveSessionPayload((prev) => ({ ...prev, expiresInSeconds: Number(e.target.value) }))} />
              </AdminFormField>
              <AdminFormField label="Max Duration (sec)" htmlFor="sandbox-live-max-duration">
                <Input id="sandbox-live-max-duration" type="number" value={liveSessionPayload.maxSessionDurationSeconds} onChange={(e) => setLiveSessionPayload((prev) => ({ ...prev, maxSessionDurationSeconds: Number(e.target.value) }))} />
              </AdminFormField>
              <AdminFormField label="Language" htmlFor="sandbox-live-language">
                <Input id="sandbox-live-language" value={liveSessionPayload.languageCode} onChange={(e) => setLiveSessionPayload((prev) => ({ ...prev, languageCode: e.target.value }))} />
              </AdminFormField>
            </div>

            <div className="mt-4 flex gap-2">
              <Button onClick={() => liveSessionCreateMutation.mutate()} disabled={liveSessionCreateMutation.isPending}>
                {liveSessionCreateMutation.isPending ? 'Creating...' : 'Create Live Session'}
              </Button>
              <Input
                placeholder="Paste session ID"
                value={sessionIdLookup}
                onChange={(e) => setSessionIdLookup(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={() => liveSessionStatusQuery.refetch()}
                disabled={!sessionIdLookup || liveSessionStatusQuery.isFetching}
              >
                {liveSessionStatusQuery.isFetching ? 'Checking...' : 'Check Status'}
              </Button>
            </div>

            {liveSessionStatusQuery.data && (
              <pre className="mt-4 rounded border p-3 text-xs overflow-auto bg-muted/40">
                {JSON.stringify(liveSessionStatusQuery.data, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audio Transcription Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              <AdminFormField label="Provider" htmlFor="sandbox-transcription-provider">
                <Select value={transcriptionPayload.provider} onValueChange={(value) => setTranscriptionPayload((prev) => ({ ...prev, provider: value }))}>
                  <SelectTrigger id="sandbox-transcription-provider"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </AdminFormField>

              <AdminFormField label="Request ID (optional)" htmlFor="sandbox-transcription-request-id">
                <Input id="sandbox-transcription-request-id" value={transcriptionPayload.requestId} onChange={(e) => setTranscriptionPayload((prev) => ({ ...prev, requestId: e.target.value }))} />
              </AdminFormField>
              <AdminFormField label="Audio File" htmlFor="sandbox-transcription-audio">
                <Input id="sandbox-transcription-audio" type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} />
              </AdminFormField>
            </div>

            <div className="mt-4">
              <TranscriptionSettings
                transcriptionLanguage={toTranscriptionLanguage(transcriptionPayload.languageCode)}
                onLanguageSelect={(language) =>
                  setTranscriptionPayload((prev) => ({ ...prev, languageCode: fromTranscriptionLanguage(language) }))
                }
                useSpeechModelNano={transcriptionPayload.useSpeechModelNano}
                setUseSpeechModelNano={(value) =>
                  setTranscriptionPayload((prev) => ({ ...prev, useSpeechModelNano: value }))
                }
                acceptSuggestions={acceptSuggestions}
                setAcceptSuggestions={setAcceptSuggestions}
              />
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button onClick={() => transcriptionMutation.mutate()} disabled={!audioFile || transcriptionMutation.isPending}>
                {transcriptionMutation.isPending ? 'Running...' : 'Run Transcription Test'}
              </Button>
              <Badge variant="outline">Internal / non-billable</Badge>
            </div>

            {transcriptionMutation.data && (
              <pre className="mt-4 rounded border p-3 text-xs overflow-auto bg-muted/40">
                {JSON.stringify(transcriptionMutation.data, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Provider Failover Simulation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <AdminFormField label="Current Provider" htmlFor="sandbox-failover-current-provider">
                <Select
                  value={failoverPayload.currentProvider}
                  onValueChange={(value) => setFailoverPayload((prev) => ({ ...prev, currentProvider: value }))}
                >
                  <SelectTrigger id="sandbox-failover-current-provider"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </AdminFormField>

              <AdminFormField label="Fallback Provider" htmlFor="sandbox-failover-fallback-provider">
                <Select
                  value={failoverPayload.fallbackProvider}
                  onValueChange={(value) => setFailoverPayload((prev) => ({ ...prev, fallbackProvider: value }))}
                >
                  <SelectTrigger id="sandbox-failover-fallback-provider"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </AdminFormField>

              <AdminFormField label="Language Code" htmlFor="sandbox-failover-language">
                <Input
                  id="sandbox-failover-language"
                  value={failoverPayload.languageCode}
                  onChange={(e) => setFailoverPayload((prev) => ({ ...prev, languageCode: e.target.value }))}
                />
              </AdminFormField>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button
                onClick={() => failoverSimulationMutation.mutate()}
                disabled={failoverSimulationMutation.isPending}
              >
                {failoverSimulationMutation.isPending ? 'Simulating...' : 'Run Failover Simulation'}
              </Button>
              {failoverSimulationMutation.data && (
                <Badge variant={failoverSimulationMutation.data.canFailover ? 'default' : 'secondary'}>
                  {failoverSimulationMutation.data.canFailover ? 'Pass' : 'Warning'}
                </Badge>
              )}
            </div>

            {failoverSimulationMutation.data && (
              <pre className="mt-4 rounded border p-3 text-xs overflow-auto bg-muted/40">
                {JSON.stringify(failoverSimulationMutation.data, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sandbox Webhook Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <AdminFormField label="Target URL" htmlFor="sandbox-webhook-target-url">
                <Input
                  id="sandbox-webhook-target-url"
                  value={webhookPayload.targetUrl}
                  onChange={(e) => setWebhookPayload((prev) => ({ ...prev, targetUrl: e.target.value }))}
                />
              </AdminFormField>
              <AdminFormField label="Event Type" htmlFor="sandbox-webhook-event-type">
                <Input
                  id="sandbox-webhook-event-type"
                  value={webhookPayload.eventType}
                  onChange={(e) => setWebhookPayload((prev) => ({ ...prev, eventType: e.target.value }))}
                />
              </AdminFormField>
            </div>

            <div className="mt-3">
              <AdminFormField label="Payload (optional JSON string)" htmlFor="sandbox-webhook-payload">
              <Textarea
                id="sandbox-webhook-payload"
                value={webhookPayload.payload}
                onChange={(e) => setWebhookPayload((prev) => ({ ...prev, payload: e.target.value }))}
                className="mt-1 min-h-24"
              />
              </AdminFormField>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button
                onClick={() => webhookTestMutation.mutate()}
                disabled={webhookTestMutation.isPending || !webhookPayload.targetUrl || !webhookPayload.eventType}
              >
                {webhookTestMutation.isPending ? 'Submitting...' : 'Create Webhook Test'}
              </Button>
              <Badge variant="outline">Dry-run endpoint</Badge>
            </div>

            {webhookTestMutation.data && (
              <pre className="mt-4 rounded border p-3 text-xs overflow-auto bg-muted/40">
                {JSON.stringify(webhookTestMutation.data, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supported Languages</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {languagesQuery.isLoading && <TableRow><TableCell colSpan={2}>Loading languages...</TableCell></TableRow>}
                {languageRows.slice(0, 30).map((lang) => (
                  <TableRow key={lang.code}>
                    <TableCell className="font-mono">{lang.code}</TableCell>
                    <TableCell>{lang.name || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
