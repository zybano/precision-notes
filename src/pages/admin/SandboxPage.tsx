
import {useEffect, useMemo, useRef, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
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
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import {adminApiService} from '@/services/adminApiService';
import PlatformModuleHeader from '@/components/admin/PlatformModuleHeader';
import AdminFormField from '@/components/admin/AdminFormField';
import {
  AdminJsonResult,
  AdminMetricTile,
  AdminSectionPanel,
  AdminStatusPill,
  AdminTableShell,
  AudioVisualizer
} from '@/components/admin/AdminSurface';
import TranscriptionSettings from '@/components/documentation/TranscriptionSettings';
import {TranscriptionLanguage} from '@/hooks/useDocumentFormat';
import {DocumentFormat, LLMProvider} from '@/types/transcription';
import {toast} from 'sonner';
import {
  Activity,
  AudioLines,
  FileAudio,
  FileText,
  FlaskConical,
  Languages,
  Mic,
  Radio,
  Route,
  Server,
  Settings2,
  Webhook,
  Workflow
} from 'lucide-react';

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
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [audioInputMode, setAudioInputMode] = useState<'file' | 'recording'>('file');
  const [isRecording, setIsRecording] = useState(false);
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
  const [documentationPayload, setDocumentationPayload] = useState({
    llmProvider: LLMProvider.OPENAI,
    documentFormat: DocumentFormat.SOAP,
    templateId: '',
    transcriptText: '',
    templateVariables: '{"tone":"clinical"}',
  });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);

  const resolveAudioUploadFile = (): File | null => {
    if (audioInputMode === 'file') {
      return audioFile;
    }
    if (recordedAudioBlob) {
      return new File([recordedAudioBlob], 'sandbox-recording.webm', { type: recordedAudioBlob.type || 'audio/webm' });
    }
    return null;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordingChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(recordingChunksRef.current, { type: mimeType });
        setRecordedAudioBlob(blob.size > 0 ? blob : null);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      toast.success('Recording started');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success('Recording captured');
    }
  };

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

  const templatesQuery = useQuery({
    queryKey: ['sandbox', 'templates'],
    enabled: Boolean(sessionToken),
    queryFn: async () => {
      const response = await adminApiService.getPlatformSandboxTemplates(sessionToken as string);
      if (!response.success) throw new Error(response.error || 'Failed to load templates');
      return (response.data || []) as Array<{
        id: string;
        name: string;
        ownerType?: string;
      }>;
    },
  });

  const providerRows = useMemo(() => providerConfigQuery.data?.providers || [], [providerConfigQuery.data]);
  const languageRows = useMemo(() => languagesQuery.data?.canonicalLanguages || [], [languagesQuery.data]);

  const parseTemplateVariables = () => {
    if (!documentationPayload.templateVariables.trim()) {
      return undefined;
    }
    try {
      return JSON.parse(documentationPayload.templateVariables) as Record<string, unknown>;
    } catch {
      throw new Error('Template variables must be valid JSON');
    }
  };

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
      const selectedAudio = resolveAudioUploadFile();
      if (!selectedAudio) {
        throw new Error('Audio file is required');
      }
      const response = await adminApiService.createPlatformTranscription(sessionToken as string, {
        audioFile: selectedAudio,
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

  const documentationPreview = useMemo(() => {
    const result = transcriptionMutation.data;
    const transcriptText = documentationPayload.transcriptText.trim() || (result?.transcript || result?.text || '').toString();
    if (!transcriptText) {
      return null;
    }

    let parsedTemplateVariables: Record<string, unknown> | null = null;
    try {
      parsedTemplateVariables = documentationPayload.templateVariables.trim()
        ? JSON.parse(documentationPayload.templateVariables)
        : null;
    } catch {
      parsedTemplateVariables = { raw: documentationPayload.templateVariables };
    }

    return {
      source: documentationPayload.transcriptText.trim() ? 'manual-transcript' : 'sandbox-transcription-test',
      llmProvider: documentationPayload.llmProvider,
      documentFormat: documentationPayload.documentFormat,
      templateId: documentationPayload.templateId || undefined,
      templateVariables: parsedTemplateVariables,
      acceptSuggestions,
      useSpeechModelNano: transcriptionPayload.useSpeechModelNano,
      transcriptText,
    };
  }, [documentationPayload.documentFormat, documentationPayload.llmProvider, documentationPayload.templateId, documentationPayload.templateVariables, documentationPayload.transcriptText, acceptSuggestions, transcriptionMutation.data, transcriptionPayload.useSpeechModelNano]);

  const combinedFlowMutation = useMutation({
    mutationFn: async () => {
      const selectedAudio = resolveAudioUploadFile();
      if (!selectedAudio) {
        throw new Error('Audio input is required (file or recording)');
      }

      const response = await adminApiService.createPlatformCombinedTranscription(sessionToken as string, {
        templateId: documentationPayload.templateId || undefined,
        templateVariables: parseTemplateVariables(),
        audioFile: selectedAudio,
        provider: transcriptionPayload.provider,
        documentFormat: documentationPayload.documentFormat,
        languageCode: transcriptionPayload.languageCode || undefined,
        useSpeechModelNano: transcriptionPayload.useSpeechModelNano,
        modelName: documentationPayload.llmProvider,
        requestId: transcriptionPayload.requestId || undefined,
        includeSummary: true,
        acceptSuggestions,
      });

      if (!response.success) {
        throw new Error(response.error || 'Combined flow failed');
      }

      return response.data;
    },
    onSuccess: () => {
      toast.success('Combined flow completed');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const documentationMutation = useMutation({
    mutationFn: async () => {
      const transcriptText = documentationPayload.transcriptText.trim()
        || (transcriptionMutation.data?.transcript || transcriptionMutation.data?.text || '').toString();

      if (!transcriptText) {
        throw new Error('Transcript text is required for documentation generation');
      }

      const parsedTemplateVariables: Record<string, unknown> | undefined = parseTemplateVariables();

      const response = await adminApiService.createSandboxDocumentation(sessionToken as string, {
        documentFormat: documentationPayload.documentFormat,
        transcriptText,
        includeSummary: true,
        acceptSuggestions,
        modelName: documentationPayload.llmProvider,
        templateId: documentationPayload.templateId || undefined,
        templateVariables: parsedTemplateVariables,
      });

      if (!response.success) {
        throw new Error(response.error || 'Documentation generation failed');
      }

      return response.data;
    },
    onSuccess: () => {
      toast.success('Documentation generated');
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
      <div className="space-y-6">
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

  const enabledProviderCount = sandboxCapabilitiesQuery.data?.enabledProviders?.length ?? providerRows.filter((row) => row.enabled).length;
  const audioReady = Boolean(resolveAudioUploadFile());
  const latestRunLabel = combinedFlowMutation.data
    ? 'Combined flow complete'
    : documentationMutation.data
      ? 'Documentation complete'
      : transcriptionMutation.data
        ? 'Transcription complete'
        : recordedAudioBlob
          ? 'Recording captured'
          : audioFile
            ? 'Audio file ready'
            : 'Awaiting audio';

  return (
    <div className="space-y-6">
      <PlatformModuleHeader
        title="Sandbox"
        description="Safe environment for testing providers, transcription settings, and language options."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricTile label="Providers" value={providerRows.length} helper={`${enabledProviderCount} enabled`} icon={<Server className="h-4 w-4" />} tone="info" />
        <AdminMetricTile label="Default Provider" value={providerConfigQuery.data?.defaultProvider || '-'} helper="Routing preference" icon={<Settings2 className="h-4 w-4" />} />
        <AdminMetricTile label="Languages" value={languageRows.length} helper="Canonical language rows" icon={<Languages className="h-4 w-4" />} tone="success" />
        <AdminMetricTile label="Latest Test" value={latestRunLabel} helper={audioReady ? 'Audio input ready' : 'Needs audio input'} icon={<Activity className="h-4 w-4" />} tone={audioReady ? 'success' : 'warning'} />
      </div>

      <Tabs defaultValue="provider-lab" className="space-y-5">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-lg border border-slate-200 bg-white p-1 text-slate-500 md:grid-cols-5">
          <TabsTrigger value="provider-lab" className="gap-2 rounded-md py-2.5 data-[state=active]:bg-slate-950 data-[state=active]:text-white">
            <FlaskConical className="h-4 w-4" />
            Provider Lab
          </TabsTrigger>
          <TabsTrigger value="audio-test" className="gap-2 rounded-md py-2.5 data-[state=active]:bg-slate-950 data-[state=active]:text-white">
            <AudioLines className="h-4 w-4" />
            Audio Test
          </TabsTrigger>
          <TabsTrigger value="documentation-flow" className="gap-2 rounded-md py-2.5 data-[state=active]:bg-slate-950 data-[state=active]:text-white">
            <FileText className="h-4 w-4" />
            Docs Flow
          </TabsTrigger>
          <TabsTrigger value="live-sessions" className="gap-2 rounded-md py-2.5 data-[state=active]:bg-slate-950 data-[state=active]:text-white">
            <Radio className="h-4 w-4" />
            Live Sessions
          </TabsTrigger>
          <TabsTrigger value="failover-webhooks" className="gap-2 rounded-md py-2.5 data-[state=active]:bg-slate-950 data-[state=active]:text-white">
            <Route className="h-4 w-4" />
            Failover
          </TabsTrigger>
        </TabsList>

        <TabsContent value="provider-lab" className="space-y-5">
          <AdminSectionPanel
            title="Provider Health Rail"
            description="Provider routing, capability, and enabled-state controls."
            actions={(
              <>
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
              </>
            )}
          >
            <div className="grid gap-3 lg:grid-cols-3">
              {providerRows.map((row) => (
                <div key={row.provider} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{row.provider}</p>
                      <p className="mt-1 text-xs text-slate-500">{row.liveTransport || 'No live transport configured'}</p>
                    </div>
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
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <AdminStatusPill tone={row.enabled ? 'success' : 'neutral'} icon={row.enabled ? 'success' : undefined}>
                      {row.enabled ? 'Enabled' : 'Disabled'}
                    </AdminStatusPill>
                    <AdminStatusPill tone={row.provider === defaultProvider ? 'info' : 'neutral'}>
                      {row.provider === defaultProvider ? 'Default' : 'Standby'}
                    </AdminStatusPill>
                    <AdminStatusPill tone={row.supportsUploadedMedia ? 'success' : 'neutral'}>Upload</AdminStatusPill>
                    <AdminStatusPill tone={row.supportsLive ? 'success' : 'neutral'}>Live</AdminStatusPill>
                  </div>
                </div>
              ))}
              {providerConfigQuery.isLoading && (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  Loading provider configuration...
                </div>
              )}
            </div>
          </AdminSectionPanel>

          <AdminSectionPanel title="Supported Languages" description="First 30 canonical language rows returned by the platform API.">
            <AdminTableShell>
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
                      <TableCell className="font-mono text-xs">{lang.code}</TableCell>
                      <TableCell>{lang.name || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AdminTableShell>
          </AdminSectionPanel>
        </TabsContent>

        <TabsContent value="audio-test" className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <AdminSectionPanel
              title="Audio Input"
              description="Upload audio or capture a short browser recording before running transcription."
              actions={<AdminStatusPill tone={audioReady ? 'success' : 'warning'}>{audioReady ? 'Audio ready' : 'No audio selected'}</AdminStatusPill>}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <AdminFormField label="Audio Input" htmlFor="sandbox-audio-mode">
                  <Select value={audioInputMode} onValueChange={(value) => setAudioInputMode(value as 'file' | 'recording')}>
                    <SelectTrigger id="sandbox-audio-mode"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="file">Upload File</SelectItem>
                      <SelectItem value="recording">Record Audio</SelectItem>
                    </SelectContent>
                  </Select>
                </AdminFormField>
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
                {audioInputMode === 'file' ? (
                  <AdminFormField label="Audio File" htmlFor="sandbox-transcription-audio">
                    <Input id="sandbox-transcription-audio" type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} />
                  </AdminFormField>
                ) : (
                  <AdminFormField label="Audio Recorder" htmlFor="sandbox-recorder-controls">
                    <div id="sandbox-recorder-controls" className="flex flex-wrap items-center gap-2">
                      {!isRecording ? (
                        <Button type="button" variant="outline" onClick={startRecording}><Mic className="mr-2 h-4 w-4" />Start Recording</Button>
                      ) : (
                        <Button type="button" variant="outline" onClick={stopRecording}>Stop</Button>
                      )}
                      <Button type="button" variant="ghost" onClick={() => setRecordedAudioBlob(null)} disabled={!recordedAudioBlob}>Clear</Button>
                    </div>
                  </AdminFormField>
                )}
              </div>

              <div className="mt-5">
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

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button onClick={() => transcriptionMutation.mutate()} disabled={!audioReady || transcriptionMutation.isPending}>
                  {transcriptionMutation.isPending ? 'Running...' : 'Run Transcription Test'}
                </Button>
                <AdminStatusPill tone="info"><FileAudio className="h-3.5 w-3.5" />Transcription only</AdminStatusPill>
              </div>
            </AdminSectionPanel>

            <div className="space-y-5">
              <AudioVisualizer active={isRecording || transcriptionMutation.isPending || audioReady} label={isRecording ? 'Recording live input' : audioReady ? 'Audio input staged' : 'Waiting for audio'} />
              {transcriptionMutation.data && <AdminJsonResult title="Transcription Result" data={transcriptionMutation.data} />}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documentation-flow" className="space-y-5">
          <AdminSectionPanel
            title="Documentation Flow"
            description="Generate documentation from pasted transcript text or the latest transcription output."
            actions={<AdminStatusPill tone={documentationPreview ? 'success' : 'neutral'}>{documentationPreview ? 'Preview ready' : 'Needs transcript'}</AdminStatusPill>}
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <AdminFormField label="LLM Provider" htmlFor="sandbox-doc-provider">
                <Select
                  value={documentationPayload.llmProvider}
                  onValueChange={(value) =>
                    setDocumentationPayload((prev) => ({
                      ...prev,
                      llmProvider: value as LLMProvider,
                    }))
                  }
                >
                  <SelectTrigger id="sandbox-doc-provider"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={LLMProvider.OPENAI}>OpenAI</SelectItem>
                    <SelectItem value={LLMProvider.CLAUDE}>Claude</SelectItem>
                    <SelectItem value={LLMProvider.GEMINI}>Gemini</SelectItem>
                  </SelectContent>
                </Select>
              </AdminFormField>
              <AdminFormField label="Document Format" htmlFor="sandbox-doc-format">
                <Select
                  value={documentationPayload.documentFormat}
                  onValueChange={(value) =>
                    setDocumentationPayload((prev) => ({
                      ...prev,
                      documentFormat: value as DocumentFormat,
                    }))
                  }
                >
                  <SelectTrigger id="sandbox-doc-format"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DocumentFormat.SOAP}>SOAP</SelectItem>
                    <SelectItem value={DocumentFormat.PROGRESS}>Progress</SelectItem>
                    <SelectItem value={DocumentFormat.CONSULTATION}>Consultation</SelectItem>
                    <SelectItem value={DocumentFormat.DISCHARGE}>Discharge</SelectItem>
                    <SelectItem value={DocumentFormat.HISTORY_AND_PHYSICAL}>History &amp; Physical</SelectItem>
                    <SelectItem value={DocumentFormat.DICTATION}>Dictation</SelectItem>
                  </SelectContent>
                </Select>
              </AdminFormField>
              <AdminFormField label="Template" htmlFor="sandbox-doc-template-id">
                <Select
                  value={documentationPayload.templateId || '__none'}
                  onValueChange={(value) =>
                    setDocumentationPayload((prev) => ({
                      ...prev,
                      templateId: value === '__none' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger id="sandbox-doc-template-id"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No template</SelectItem>
                    {templatesQuery.data?.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}{template.ownerType ? ` (${template.ownerType})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </AdminFormField>
              <AdminFormField label="Provider for Combined Audio" htmlFor="sandbox-combined-provider">
                <Select value={transcriptionPayload.provider} onValueChange={(value) => setTranscriptionPayload((prev) => ({ ...prev, provider: value }))}>
                  <SelectTrigger id="sandbox-combined-provider"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </AdminFormField>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <AdminFormField label="Transcript Text" htmlFor="sandbox-doc-transcript">
                <Textarea
                  id="sandbox-doc-transcript"
                  className="min-h-40"
                  placeholder="Paste transcript text, or run transcription and leave this empty to reuse last transcript output."
                  value={documentationPayload.transcriptText}
                  onChange={(e) => setDocumentationPayload((prev) => ({ ...prev, transcriptText: e.target.value }))}
                />
              </AdminFormField>
              <AdminFormField label="Template Variables (JSON)" htmlFor="sandbox-doc-template-vars">
                <Textarea
                  id="sandbox-doc-template-vars"
                  className="min-h-40"
                  value={documentationPayload.templateVariables}
                  onChange={(e) => setDocumentationPayload((prev) => ({ ...prev, templateVariables: e.target.value }))}
                />
              </AdminFormField>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button onClick={() => documentationMutation.mutate()} disabled={documentationMutation.isPending}>
                {documentationMutation.isPending ? 'Generating...' : 'Run Documentation Only'}
              </Button>
              <Button onClick={() => combinedFlowMutation.mutate()} disabled={!audioReady || combinedFlowMutation.isPending} variant="outline">
                {combinedFlowMutation.isPending ? 'Running Combined Flow...' : 'Run Combined Flow'}
              </Button>
              <AdminStatusPill tone="info"><Workflow className="h-3.5 w-3.5" />Template + variables + audio</AdminStatusPill>
            </div>
          </AdminSectionPanel>

          <div className="grid gap-5 lg:grid-cols-3">
            {documentationPreview && <AdminJsonResult title="Documentation Preview" data={documentationPreview} />}
            {documentationMutation.data && <AdminJsonResult title="Documentation Result" data={documentationMutation.data} />}
            {combinedFlowMutation.data && <AdminJsonResult title="Combined Flow Result" data={combinedFlowMutation.data} />}
          </div>
        </TabsContent>

        <TabsContent value="live-sessions" className="space-y-5">
          <AdminSectionPanel
            title="Live Session Tools"
            description="Create a provider-backed live session and inspect session status."
            actions={<AdminStatusPill tone={liveSessionStatusQuery.data ? 'success' : 'neutral'}>{liveSessionStatusQuery.data ? 'Status loaded' : 'Ready'}</AdminStatusPill>}
          >
            <div className="grid gap-4 md:grid-cols-4">
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

            <div className="mt-5 grid gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto]">
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

            {liveSessionStatusQuery.data && <AdminJsonResult className="mt-5" title="Live Session Status" data={liveSessionStatusQuery.data} />}
          </AdminSectionPanel>
        </TabsContent>

        <TabsContent value="failover-webhooks" className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-2">
            <AdminSectionPanel
              title="Provider Failover Simulation"
              description="Check whether a provider can route to the selected fallback."
              actions={failoverSimulationMutation.data && (
                <AdminStatusPill tone={failoverSimulationMutation.data.canFailover ? 'success' : 'warning'}>
                  {failoverSimulationMutation.data.canFailover ? 'Pass' : 'Warning'}
                </AdminStatusPill>
              )}
            >
              <div className="grid gap-4 md:grid-cols-3">
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
              <div className="mt-5">
                <Button
                  onClick={() => failoverSimulationMutation.mutate()}
                  disabled={failoverSimulationMutation.isPending}
                >
                  {failoverSimulationMutation.isPending ? 'Simulating...' : 'Run Failover Simulation'}
                </Button>
              </div>
              {failoverSimulationMutation.data && <AdminJsonResult className="mt-5" title="Failover Result" data={failoverSimulationMutation.data} />}
            </AdminSectionPanel>

            <AdminSectionPanel
              title="Sandbox Webhook Test"
              description="Submit a dry-run webhook event payload to the sandbox endpoint."
              actions={<AdminStatusPill tone="info"><Webhook className="h-3.5 w-3.5" />Dry run</AdminStatusPill>}
            >
              <div className="grid gap-4 md:grid-cols-2">
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
              <div className="mt-4">
                <AdminFormField label="Payload (optional JSON string)" htmlFor="sandbox-webhook-payload">
                  <Textarea
                    id="sandbox-webhook-payload"
                    value={webhookPayload.payload}
                    onChange={(e) => setWebhookPayload((prev) => ({ ...prev, payload: e.target.value }))}
                    className="min-h-32"
                  />
                </AdminFormField>
              </div>
              <div className="mt-5">
                <Button
                  onClick={() => webhookTestMutation.mutate()}
                  disabled={webhookTestMutation.isPending || !webhookPayload.targetUrl || !webhookPayload.eventType}
                >
                  {webhookTestMutation.isPending ? 'Submitting...' : 'Create Webhook Test'}
                </Button>
              </div>
              {webhookTestMutation.data && <AdminJsonResult className="mt-5" title="Webhook Result" data={webhookTestMutation.data} />}
            </AdminSectionPanel>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
