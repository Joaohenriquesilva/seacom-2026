import {newsToHtml} from './lib/newsRichText';
import AdminSeguro from './AdminSeguro';
import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Mic,
  Newspaper,
  CheckCircle2,
  Shield,
  LogOut,
  Plus,
  Trash2,
  Search,
  Filter,
  ChevronRight,
  Award,
  Sparkles,
  BookOpen,
  UserCheck,
  Settings,
  Lock,
  User,
  FileText,
  AlertCircle,
  Check,
  X,
  ArrowRight,
  Copy,
  Radio,
  Camera,
  Share2,
  Eye,
  Layers,
  UserPlus
} from 'lucide-react';

// ============================================================================
// FUNÇÕES UTILITÁRIAS DE DATA
// ============================================================================

const isoToBrDate = (isoStr) => {
  if (!isoStr || !isoStr.includes('-')) return isoStr || '';
  const [year, month, day] = isoStr.split('-');
  if (!year || !month || !day) return isoStr;
  return `${day}/${month}/${year}`;
};

const brToIsoDate = (brStr) => {
  if (!brStr) return '';
  if (brStr.includes('-')) return brStr;
  const parts = brStr.split('/');
  if (parts.length !== 3) return '';
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const getWeekdayShort = (isoStr) => {
  if (!isoStr || !isoStr.includes('-')) return '';
  const [y, m, d] = isoStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  if (isNaN(dateObj.getTime())) return '';
  const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return weekdays[dateObj.getDay()];
};

const parseHours = (workloadStr) => {
  if (!workloadStr) return 0;
  const match = String(workloadStr).match(/(\d+(?:[.,]\d+)?)/);
  return match ? parseFloat(match[1].replace(',', '.')) : 0;
};

// ============================================================================
// DADOS INICIAIS
// ============================================================================

const INITIAL_SITE_CONFIG = {
  acronym: 'SEACOM',
  fullName: 'Semana Acadêmica de Comunicação',
  edition: 'XIII Edição • 2026',
  heroBadge: 'Inscrições Abertas • Evento Presencial & Certificado MEC (30h)',
  heroTitle: 'O Futuro da Comunicação, Jornalismo e Cultura Digital',
  heroSubtitle:
    'Participe de dias imersivos de Painéis, Mesas Redondas, Oficinas e Debates com grandes nomes do jornalismo, assessoria de imprensa, fotojornalismo, audiovisual e comunicação pública.',
  eventDateRange: '10 a 12 de Novembro de 2026',
  mainLocation: 'Complexo de Comunicação & Auditório Central da Universidade',
  organizer: 'Coordenação e Centro Acadêmico de Comunicação Social',
  contactEmail: 'contato@seacom.edu.br',
  aboutText:
    'A Semana Acadêmica de Comunicação (SEACOM) é o principal espaço de encontro entre estudantes, pesquisadores e profissionais do mercado de comunicação.',
  days: [
    {
      id: 'dia-1',
      label: 'Dia 1',
      isoDate: '2026-11-10',
      date: '10/11/2026',
      title: 'Jornalismo, Ética e Espaço Público'
    },
    {
      id: 'dia-2',
      label: 'Dia 2',
      isoDate: '2026-11-11',
      date: '11/11/2026',
      title: 'Imagem, Estética e Produção Audiovisual'
    },
    {
      id: 'dia-3',
      label: 'Dia 3',
      isoDate: '2026-11-12',
      date: '12/11/2026',
      title: 'Estratégia Digital, Assessoria e Inovação'
    }
  ]
};

const INITIAL_ACTIVITIES = [
  {
    id: 'act-1',
    type: 'Mesa Redonda',
    title: 'Assessoria de Imprensa, Comunicação Pública e Gestão de Crise na Era Digital',
    dayId: 'dia-1',
    isoDate: '2026-11-10',
    date: '10/11/2026',
    startTime: '09:00',
    endTime: '11:30',
    location: 'Auditório Central - Bloco A',
    workload: '3h',
    totalSpots: 120,
    enrolledCount: 84,
    thematicAxis: 'Assessoria e Comunicação Pública',
    status: 'Inscrições Abertas',
    mediator: 'Prof. Dr. Marcos Tavares',
    speakers: 'Dra. Helena Vasconcelos e Carlos Eduardo Mendes',
    speakerBio: 'Especialistas com mais de 15 anos em comunicação institucional.',
    description:
      'Debate aprofundado sobre o papel estratégico do assessor de imprensa em órgãos públicos e corporações privadas.'
  },
  {
    id: 'act-3',
    type: 'Painel',
    title: 'Fotojornalismo Contemporâneo, Estética Visual e Narrativas Documentais',
    dayId: 'dia-2',
    isoDate: '2026-11-11',
    date: '11/11/2026',
    startTime: '09:00',
    endTime: '11:30',
    location: 'Sala Multimídia 02 - Bloco de Comunicação',
    workload: '3h',
    totalSpots: 80,
    enrolledCount: 71,
    thematicAxis: 'Fotojornalismo e Audiovisual',
    status: 'Últimas Vagas',
    mediator: 'Profa. Ma. Camila Rocha',
    speakers: 'Gabriel Paiva e Clara Monteiro',
    speakerBio: 'Vencedores de prêmios nacionais de reportagem visual.',
    description:
      'Como construir narrativas visuais potentes através da fotografia documental e edição ética de imagens.'
  }
];

const INITIAL_NEWS = [
  {
    id: 'news-1',
    title: 'Inscrições abertas para a SEACOM: garanta sua vaga nos Painéis e Mesas Redondas!',
    category: 'Comunicado Oficial',
    date: '02/11/2026',
    author: 'Comissão Organizadora SEACOM',
    summary:
      'Os estudantes e profissionais já podem realizar a inscrição geral no evento e selecionar os painéis e mesas redondas de sua preferência.',
    content:
      'A Comissão Organizadora da Semana Acadêmica de Comunicação (SEACOM) anuncia oficialmente a abertura das inscrições para todas as atividades da programação. Neste ano, o sistema permite que o participante escolha diretamente no formulário de inscrição quais Painéis e Mesas Redondas deseja acompanhar em cada dia.',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80'
  }
];

const PERMISSION_MODULES = [
  {
    key: 'noticias',
    label: 'Mural de Notícias',
    shortLabel: 'Notícias',
    description: 'Permite acessar a aba de Notícias e realizar as ações marcadas abaixo:',
    actions: [
      { key: 'noticias_criar', label: 'Postar novas notícias e comunicados' },
      { key: 'noticias_editar', label: 'Editar e atualizar notícias existentes' },
      { key: 'noticias_excluir', label: 'Excluir notícias do site' }
    ]
  },
  {
    key: 'programacao',
    label: 'Programação (Painéis, Mesas & Datas)',
    shortLabel: 'Programação',
    description: 'Permite acessar a aba de Programação e realizar as ações marcadas abaixo:',
    actions: [
      { key: 'programacao_criar', label: 'Cadastrar novos Painéis, Mesas Redondas e Dias' },
      { key: 'programacao_editar', label: 'Editar Painéis, Mesas, horários e datas' },
      { key: 'programacao_excluir', label: 'Excluir Painéis e Mesas da programação' }
    ]
  },
  {
    key: 'inscritos',
    label: 'Participantes Inscritos',
    shortLabel: 'Inscritos',
    description: 'Permite acessar a lista de alunos e participantes inscritos no evento:',
    actions: [
      { key: 'inscritos_ver', label: 'Visualizar e filtrar inscritos por atividade' },
      { key: 'inscritos_excluir', label: 'Cancelar / remover inscrições de participantes' }
    ]
  },
  {
    key: 'configuracoes',
    label: 'Textos & Configurações Gerais do Site',
    shortLabel: 'Configurações',
    description: 'Permite alterar textos institucionais, banner inicial e datas gerais:',
    actions: [
      { key: 'configuracoes_editar', label: 'Editar textos, títulos do site e dias do evento' }
    ]
  }
];

const syncModulePermissions = (perms) => {
  const updated = { ...perms };
  updated.noticias = Boolean(
    updated.noticias_criar || updated.noticias_editar || updated.noticias_excluir
  );
  updated.programacao = Boolean(
    updated.programacao_criar || updated.programacao_editar || updated.programacao_excluir
  );
  updated.inscritos = Boolean(updated.inscritos_ver || updated.inscritos_excluir);
  updated.configuracoes = Boolean(updated.configuracoes_editar);
  return updated;
};

const INITIAL_ADMINS = []; // Contas administrativas são gerenciadas no Supabase Auth.

const INITIAL_REGISTRATIONS = [
  {
    id: 'reg-101',
    protocol: 'SEACOM-2026-8491',
    name: 'Mariana Costa Oliveira',
    email: 'mariana.oliveira@aluno.edu.br',
    cpfOrId: '202310459',
    course: '',
    period: '5º Período',
    phone: '(68) 99912-3456',
    institution: '',
    selectedActivityIds: ['act-1', 'act-3'],
    createdAt: '05/11/2026 às 14:20'
  }
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function App() {
  const validPages = ['home', 'schedule', 'news', 'register', 'admin', 'article'];
  const getPageFromUrl = () => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    if (hash.startsWith('article/')) return 'article';
    if (validPages.includes(hash)) return hash;
    return new URLSearchParams(window.location.search).get('admin') === 'login' ? 'admin' : 'home';
  };
  const [activeTab, setActiveTabState] = useState(getPageFromUrl);
  const [contentRevision, setContentRevision] = useState(0);
  const [articleId, setArticleId] = useState(() => decodeURIComponent(window.location.hash.match(/^#\/article\/(.+)$/)?.[1] || ''));
  const setActiveTab = (page) => {
    if (!validPages.includes(page)) return;
    window.history.pushState({page}, '', `${window.location.pathname}${window.location.search}#/${page}`);
    if (page !== 'article') setArticleId('');
    setActiveTabState(page);
    setContentRevision(v => v + 1);
    window.scrollTo({top: 0, behavior: 'instant'});
  };
  const openArticle = (id) => {
    window.history.pushState({page:'article'}, '', `${window.location.pathname}${window.location.search}#/article/${encodeURIComponent(id)}`);
    setArticleId(id); setActiveTabState('article'); setContentRevision(v=>v+1);
    window.scrollTo({top:0,behavior:'instant'});
  };
  useEffect(() => {
    const onHistory = () => { setActiveTabState(getPageFromUrl()); setArticleId(decodeURIComponent(window.location.hash.match(/^#\/article\/(.+)$/)?.[1] || '')); setContentRevision(v => v + 1); };
    const onUpdated = () => setContentRevision(v => v + 1);
    window.addEventListener('popstate', onHistory);
    window.addEventListener('hashchange', onHistory);
    window.addEventListener('seacom:content-updated', onUpdated);
    return () => { window.removeEventListener('popstate', onHistory); window.removeEventListener('hashchange', onHistory); window.removeEventListener('seacom:content-updated', onUpdated); };
  }, []);

  const [siteConfig, setSiteConfig] = useState(INITIAL_SITE_CONFIG);
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);
  const [programacaoStatus, setProgramacaoStatus] = useState('carregando');
  const [programacaoErro, setProgramacaoErro] = useState('');

  // Apenas leitura pública. Não habilita escrita administrativa nem inscrições reais.
  useEffect(() => {
    let ativo = true;
    async function carregarProgramacao() {
      try {
        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
          setProgramacaoErro('Arquivo .env.local ausente ou incompleto. Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY e reinicie o Vite.');
          setProgramacaoStatus('sem-configuracao');
          return;
        }
        const { supabase } = await import('./lib/supabase');
        const { data, error } = await supabase
          .from('activities')
          .select('id,title,description,activity_type,starts_at,ends_at,location,capacity')
          .eq('is_published', true)
          .order('starts_at', { ascending: true });
        if (error) throw error;
        if (!ativo) return;
        const formatDate = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Rio_Branco', year: 'numeric', month: '2-digit', day: '2-digit'
        });
        const formatTime = new Intl.DateTimeFormat('pt-BR', {
          timeZone: 'America/Rio_Branco', hour: '2-digit', minute: '2-digit', hour12: false
        });
        const tipos = { palestra: 'Painel', oficina: 'Oficina', 'mesa-redonda': 'Mesa Redonda', outro: 'Outro' };
        const registros = (data || []).map((item) => {
          const dataInicio = new Date(item.starts_at);
          const dataFim = new Date(item.ends_at);
          const dateParts = Object.fromEntries(formatDate.formatToParts(dataInicio).map((part) => [part.type, part.value]));
          const isoDate = `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
          const speaker = null; // Consulta pública simplificada, sem dependência da relação speakers
          const horas = Math.max(0, (dataFim.getTime() - dataInicio.getTime()) / 3600000);
          return {
            id: item.id, type: tipos[item.activity_type] || 'Outro',
            title: item.title, dayId: `data-${isoDate}`, isoDate,
            date: isoToBrDate(isoDate), startTime: formatTime.format(dataInicio),
            endTime: formatTime.format(dataFim), location: item.location || 'Local a definir',
            workload: `${horas.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}h`,
            totalSpots: item.capacity ?? 0, enrolledCount: 0,
            thematicAxis: '', status: 'Programação publicada', mediator: '',
            speakers: speaker?.name || 'A confirmar', speakerBio: speaker?.bio || '',
            description: item.description || ''
          };
        });
        const datas = [...new Set(registros.map((a) => a.isoDate))].sort();
        setSiteConfig((prev) => ({
          ...prev,
          days: datas.map((date, index) => ({
            id: `data-${date}`, label: `Dia ${index + 1}`, isoDate: date,
            date: isoToBrDate(date), title: `Programação de ${isoToBrDate(date)}`
          }))
        }));
        setActivities(registros);
        setRegForm((prev) => ({ ...prev, selectedActivityIds: [] }));
        setProgramacaoStatus('conectado');
      } catch (err) {
        if (!ativo) return;
        setProgramacaoErro(err?.message || 'Não foi possível carregar a programação.');
        setProgramacaoStatus('erro');
      }
    }
    carregarProgramacao();
    return () => { ativo = false; };
  }, [contentRevision, activeTab]);

  const [homeSections, setHomeSections] = useState([{id:'hero',type:'hero',visible:true},{id:'about',type:'about',visible:true}]);
  const [newsList, setNewsList] = useState(INITIAL_NEWS);
  // Conteúdo público real, carregado sem exigir login.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { supabase } = await import('./lib/supabase');
        const [site, news] = await Promise.all([
          supabase.from('seacom_site_content').select('*').eq('id',1).maybeSingle(),
          supabase.from('seacom_news').select('*').eq('published',true).order('created_at',{ascending:false})
        ]);
        if (!alive) return;
        if (site.data) {
          const icon = document.querySelector('link[rel=\"icon\"]') || document.createElement('link');
          icon.setAttribute('rel','icon'); icon.setAttribute('href',site.data.favicon_url || '/favicon.svg');
          if (!icon.parentNode) document.head.appendChild(icon);
          setSiteConfig(prev => ({...prev, heroBadge:site.data.hero_badge,heroTitle:site.data.hero_title,heroSubtitle:site.data.hero_subtitle,aboutText:site.data.about_text,coverUrl:site.data.cover_url})); if(Array.isArray(site.data.home_sections) && site.data.home_sections.length) setHomeSections(site.data.home_sections); }
        if (!news.error) setNewsList((news.data||[]).map(n => ({id:n.id,title:n.title,summary:n.summary,content:n.body,imageUrl:n.image_url||'https://placehold.co/600x450/1e1b4b/ffffff?text=SEACOM',category:'Notícia',date:new Date(n.created_at).toLocaleDateString('pt-BR')})));
      } catch(e) { console.warn('Conteúdo público indisponível:',e); }
    })(); return () => { alive = false; };
  }, [contentRevision, activeTab]);

  const [admins, setAdmins] = useState(INITIAL_ADMINS);
  const [registrations, setRegistrations] = useState(INITIAL_REGISTRATIONS);

  const [currentAdminId, setCurrentAdminId] = useState(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const currentAdmin = useMemo(
    () => admins.find((a) => a.id === currentAdminId) || null,
    [admins, currentAdminId]
  );

  const [adminSubTab, setAdminSubTab] = useState('activities');

  const [selectedDayFilter, setSelectedDayFilter] = useState('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [scheduleSearch, setScheduleSearch] = useState('');

  const [readingNews, setReadingNews] = useState(null);

  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    cpfOrId: '',
    course: '',
    period: '1º Período',
    phone: '',
    institution: '',
    selectedActivityIds: ['act-1']
  });

  const [participantPassword, setParticipantPassword] = useState('');
  const [participantPasswordConfirm, setParticipantPasswordConfirm] = useState('');
  const [showParticipantPassword, setShowParticipantPassword] = useState(false);
  const [completedRegistration, setCompletedRegistration] = useState(null);
  const [registrationBusy, setRegistrationBusy] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupAttempted, setLookupAttempted] = useState(false);

  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const createEmptyActivityForm = (daysArray = siteConfig.days) => {
    const firstDay = daysArray[0] || {
      id: 'dia-1',
      label: 'Dia 1',
      isoDate: '2026-11-10',
      date: '10/11/2026'
    };
    return {
      id: null,
      type: 'Painel',
      title: '',
      dayId: firstDay.id,
      isoDate: firstDay.isoDate,
      date: firstDay.date,
      startTime: '09:00',
      endTime: '11:30',
      location: 'Auditório Central - Bloco A',
      workload: '3h',
      totalSpots: 100,
      enrolledCount: 0,
      thematicAxis: 'Jornalismo e Sociedade',
      status: 'Inscrições Abertas',
      mediator: '',
      speakers: '',
      speakerBio: '',
      description: ''
    };
  };

  const [activityForm, setActivityForm] = useState(() =>
    createEmptyActivityForm(INITIAL_SITE_CONFIG.days)
  );
  const [isEditingActivity, setIsEditingActivity] = useState(false);
  const [, setLastSyncedFeedback] = useState('');

  const [newsForm, setNewsForm] = useState({
    id: null,
    title: '',
    category: 'Comunicado Oficial',
    date: '06/11/2026',
    author: 'Comissão Organizadora SEACOM',
    summary: '',
    content: '',
    imageUrl:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80'
  });
  const [isEditingNews, setIsEditingNews] = useState(false);
  const [newsImageUploading, setNewsImageUploading] = useState(false);

  const handleNewsImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Por favor, selecione um arquivo de imagem válido.', 'error');
      return;
    }
    setNewsImageUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Result = event.target?.result;
      if (typeof base64Result === 'string') {
        setNewsForm((prev) => ({ ...prev, imageUrl: base64Result }));
        showToast('Foto carregada com sucesso do seu dispositivo!');
      }
      setNewsImageUploading(false);
    };
    reader.onerror = () => {
      showToast('Erro ao carregar o arquivo de imagem.', 'error');
      setNewsImageUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const [designatingUserModal, setDesignatingUserModal] = useState(null);
  const [modalError, setModalError] = useState('');

  const handleOpenCreateUserModal = () => {
    setModalError('');
    setDesignatingUserModal({
      mode: 'create',
      id: null,
      username: '',
      password: '',
      role: 'Equipe de Notícias',
      permissions: syncModulePermissions({
        noticias_criar: true,
        noticias_editar: true,
        noticias_excluir: false,
        programacao_criar: false,
        programacao_editar: false,
        programacao_excluir: false,
        inscritos_ver: false,
        inscritos_excluir: false,
        configuracoes_editar: false
      })
    });
  };

  const handleOpenEditUserModal = (adm) => {
    setModalError('');
    setDesignatingUserModal({
      mode: 'edit',
      id: adm.id,
      username: adm.username,
      password: adm.password,
      role: adm.role,
      permissions: syncModulePermissions({ ...adm.permissions })
    });
  };

  const hasPermission = (permKey) => {
    if (!currentAdmin) return false;
    if (currentAdmin.isMaster) return true;
    if (permKey === 'admins') return false;
    return Boolean(currentAdmin.permissions?.[permKey]);
  };

  const getFirstAllowedSubTab = (adminObj) => {
    if (!adminObj) return 'activities';
    if (adminObj.isMaster) return 'admins';
    if (adminObj.permissions?.programacao) return 'activities';
    if (adminObj.permissions?.noticias) return 'news';
    if (adminObj.permissions?.inscritos) return 'attendees';
    if (adminObj.permissions?.configuracoes) return 'settings';
    return 'news';
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const getDayInfo = (dayId) => {
    const found = siteConfig.days.find((d) => d.id === dayId);
    if (found) {
      const weekday = getWeekdayShort(found.isoDate);
      return {
        ...found,
        displayLabel: weekday ? `${found.label} • ${weekday}` : found.label
      };
    }
    return {
      id: dayId,
      label: 'Dia do Evento',
      displayLabel: 'Dia do Evento',
      isoDate: '',
      date: '',
      title: ''
    };
  };

  const handleSelectEventDayInForm = (newDayId) => {
    const targetDay = siteConfig.days.find((d) => d.id === newDayId);
    if (!targetDay) return;

    setActivityForm((prev) => ({
      ...prev,
      dayId: targetDay.id,
      isoDate: targetDay.isoDate,
      date: targetDay.date
    }));
    setLastSyncedFeedback(`${targetDay.label} selecionado com a data ${targetDay.date}`);
  };

  const handleChangeSpecificDateInForm = (newIsoDate) => {
    if (!newIsoDate) return;
    const formattedBrDate = isoToBrDate(newIsoDate);
    const currentDayId = activityForm.dayId;

    setActivityForm((prev) => ({
      ...prev,
      isoDate: newIsoDate,
      date: formattedBrDate
    }));

    setSiteConfig((prev) => {
      const updatedDays = prev.days.map((d) =>
        d.id === currentDayId ? { ...d, isoDate: newIsoDate, date: formattedBrDate } : d
      );
      return { ...prev, days: updatedDays };
    });

    setActivities((prev) =>
      prev.map((act) =>
        act.dayId === currentDayId ? { ...act, isoDate: newIsoDate, date: formattedBrDate } : act
      )
    );

    const dayObj = siteConfig.days.find((d) => d.id === currentDayId);
    const dayLabel = dayObj ? dayObj.label : 'Dia selecionado';
    const weekday = getWeekdayShort(newIsoDate);
    setLastSyncedFeedback(
      `Sincronizado! ${dayLabel} agora é ${formattedBrDate}${weekday ? ` (${weekday})` : ''} em todo o site.`
    );
  };

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'Mesa Redonda':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Painel':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Oficina':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  const stats = useMemo(() => {
    const panelsCount = activities.filter((a) => a.type === 'Painel').length;
    const roundtablesCount = activities.filter((a) => a.type === 'Mesa Redonda').length;
    const totalVacancies = activities.reduce((acc, a) => acc + Number(a.totalSpots || 0), 0);
    return {
      panelsCount,
      roundtablesCount,
      totalVacancies
    };
  }, [activities]);

  const selectedTotalWorkloadHours = useMemo(() => {
    return regForm.selectedActivityIds.reduce((sum, id) => {
      const act = activities.find((a) => a.id === id);
      return sum + (act ? parseHours(act.workload) : 0);
    }, 0);
  }, [regForm.selectedActivityIds, activities]);

  const filteredActivities = useMemo(() => {
    return activities
      .filter((act) => {
        const matchesDay = selectedDayFilter === 'all' || act.dayId === selectedDayFilter;
        const matchesType = selectedTypeFilter === 'all' || act.type === selectedTypeFilter;
        const q = scheduleSearch.trim().toLowerCase();
        const matchesSearch =
          !q ||
          act.title.toLowerCase().includes(q) ||
          act.speakers.toLowerCase().includes(q) ||
          act.description.toLowerCase().includes(q) ||
          act.location.toLowerCase().includes(q);
        return matchesDay && matchesType && matchesSearch;
      })
      .sort((a, b) => {
        if (a.isoDate !== b.isoDate) return (a.isoDate || '').localeCompare(b.isoDate || '');
        return a.startTime.localeCompare(b.startTime);
      });
  }, [activities, selectedDayFilter, selectedTypeFilter, scheduleSearch]);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    const matchedAdmin = admins.find(
      (adm) =>
        adm.username.trim().toLowerCase() === loginUsername.trim().toLowerCase() &&
        adm.password === loginPassword
    );

    if (matchedAdmin) {
      setCurrentAdminId(matchedAdmin.id);
      setAdminSubTab(getFirstAllowedSubTab(matchedAdmin));
      setLoginUsername('');
      setLoginPassword('');
      showToast(
        matchedAdmin.isMaster
          ? `Bem-vindo, ${matchedAdmin.username}! Acesso Mestre Total liberado.`
          : `Login realizado como ${matchedAdmin.username} (${matchedAdmin.role}).`
      );
    } else {
      setLoginError('Nome de usuário ou senha inválidos.');
    }
  };

  const fillAdminCredentials = (adminObj) => {
    if (!adminObj) return;
    setLoginUsername(adminObj.username);
    setLoginPassword(adminObj.password);
    setLoginError('');
    showToast(`Credenciais de "${adminObj.username}" preenchidas! Clique em Entrar.`, 'info');
  };

  const handleQuickSwitchAdminAccount = (adminObj) => {
    if (!adminObj) return;
    setCurrentAdminId(adminObj.id);
    setAdminSubTab(getFirstAllowedSubTab(adminObj));
    setActiveTab('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Modo de Teste Ativo: agora você está navegando como "${adminObj.username}"!`, 'info');
  };

  const handleSaveActivity = (e) => {
    e.preventDefault();
    if (isEditingActivity && !hasPermission('programacao_editar')) {
      showToast('Seu usuário não tem permissão para editar atividades.', 'error');
      return;
    }
    if (!isEditingActivity && !hasPermission('programacao_criar')) {
      showToast('Seu usuário não tem permissão para cadastrar novas atividades.', 'error');
      return;
    }
    if (!activityForm.title.trim() || !activityForm.speakers.trim()) {
      showToast('Preencha o título e os palestrantes da atividade.', 'error');
      return;
    }

    const syncedIso =
      activityForm.isoDate ||
      brToIsoDate(activityForm.date) ||
      siteConfig.days.find((d) => d.id === activityForm.dayId)?.isoDate ||
      '2026-11-10';
    const syncedBr = isoToBrDate(syncedIso);

    setSiteConfig((prev) => ({
      ...prev,
      days: prev.days.map((d) =>
        d.id === activityForm.dayId ? { ...d, isoDate: syncedIso, date: syncedBr } : d
      )
    }));

    if (isEditingActivity && activityForm.id) {
      setActivities((prev) =>
        prev.map((item) =>
          item.id === activityForm.id
            ? {
                ...item,
                ...activityForm,
                isoDate: syncedIso,
                date: syncedBr,
                totalSpots: Number(activityForm.totalSpots) || 50
              }
            : item
        )
      );
      showToast('Atividade atualizada com sucesso!');
    } else {
      const newActivity = {
        ...activityForm,
        id: `act-${Date.now()}`,
        isoDate: syncedIso,
        date: syncedBr,
        totalSpots: Number(activityForm.totalSpots) || 50,
        enrolledCount: 0
      };
      setActivities((prev) => [...prev, newActivity]);
      showToast('Nova atividade adicionada à Programação!');
    }

    const updatedDays = siteConfig.days.map((d) =>
      d.id === activityForm.dayId ? { ...d, isoDate: syncedIso, date: syncedBr } : d
    );
    setActivityForm(createEmptyActivityForm(updatedDays));
    setIsEditingActivity(false);
  };

  const handleEditActivityClick = (act) => {
    if (!hasPermission('programacao_editar')) {
      showToast('Seu usuário não tem permissão para editar atividades.', 'error');
      return;
    }
    const dayObj = siteConfig.days.find((d) => d.id === act.dayId);
    const resolvedIso = act.isoDate || brToIsoDate(act.date) || dayObj?.isoDate || '2026-11-10';
    const resolvedBr = isoToBrDate(resolvedIso);

    setActivityForm({
      ...act,
      isoDate: resolvedIso,
      date: resolvedBr,
      thematicAxis: act.thematicAxis || 'Jornalismo e Sociedade',
      status: act.status || 'Inscrições Abertas',
      mediator: act.mediator || ''
    });
    setIsEditingActivity(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteActivityClick = (act) => {
    if (!hasPermission('programacao_excluir')) {
      showToast('Seu usuário não tem permissão para excluir atividades.', 'error');
      return;
    }
    setConfirmModal({
      title: 'Excluir Atividade',
      message: `Tem certeza que deseja remover "${act.title}"?`,
      onConfirm: () => {
        setActivities((prev) => prev.filter((item) => item.id !== act.id));
        setRegForm((prev) => ({
          ...prev,
          selectedActivityIds: prev.selectedActivityIds.filter((id) => id !== act.id)
        }));
        setConfirmModal(null);
        showToast('Atividade removida com sucesso.');
      }
    });
  };

  const handleSaveNews = (e) => {
    e.preventDefault();
    if (isEditingNews && !hasPermission('noticias_editar')) {
      showToast('Seu usuário não possui permissão para editar notícias.', 'error');
      return;
    }
    if (!isEditingNews && !hasPermission('noticias_criar')) {
      showToast('Seu usuário não possui permissão para postar notícias.', 'error');
      return;
    }
    if (!newsForm.title.trim() || !newsForm.content.trim()) {
      showToast('Informe o título e o conteúdo completo da notícia.', 'error');
      return;
    }

    if (isEditingNews && newsForm.id) {
      setNewsList((prev) =>
        prev.map((item) => (item.id === newsForm.id ? { ...newsForm } : item))
      );
      showToast('Notícia atualizada com sucesso!');
    } else {
      const created = {
        ...newsForm,
        id: `news-${Date.now()}`,
        summary:
          newsForm.summary.trim() || newsForm.content.trim().slice(0, 140) + '...'
      };
      setNewsList((prev) => [created, ...prev]);
      showToast('Nova notícia publicada com sucesso!');
    }

    setNewsForm({
      id: null,
      title: '',
      category: 'Comunicado Oficial',
      date: '06/11/2026',
      author: 'Comissão Organizadora SEACOM',
      summary: '',
      content: '',
      imageUrl:
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80'
    });
    setIsEditingNews(false);
  };

  const handleEditNewsClick = (n) => {
    if (!hasPermission('noticias_editar')) {
      showToast('Seu usuário não tem permissão para editar notícias.', 'error');
      return;
    }
    setNewsForm({ ...n });
    setIsEditingNews(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteNewsClick = (n) => {
    if (!hasPermission('noticias_excluir')) {
      showToast('Seu usuário não tem permissão para excluir notícias.', 'error');
      return;
    }
    setConfirmModal({
      title: 'Remover Notícia',
      message: `Deseja realmente excluir a notícia "${n.title}"?`,
      onConfirm: () => {
        setNewsList((prev) => prev.filter((item) => item.id !== n.id));
        setConfirmModal(null);
        showToast('Notícia excluída.');
      }
    });
  };

  const handleSaveDesignatedUserModal = (e) => {
    e.preventDefault();
    setModalError('');
    if (!currentAdmin?.isMaster || !designatingUserModal) return;

    const cleanUsername = (designatingUserModal.username || '').trim();
    const cleanPassword = (designatingUserModal.password || '').trim();
    const cleanRole = (designatingUserModal.role || '').trim() || 'Usuário Designado';

    if (!cleanUsername || !cleanPassword) {
      const msg = 'Informe o Nome de Usuário e a Senha.';
      setModalError(msg);
      showToast(msg, 'error');
      return;
    }

    const syncedPerms = syncModulePermissions(designatingUserModal.permissions);
    const hasAny =
      syncedPerms.noticias ||
      syncedPerms.programacao ||
      syncedPerms.inscritos ||
      syncedPerms.configuracoes;

    if (!hasAny) {
      const msg = 'Selecione pelo menos uma função para este usuário.';
      setModalError(msg);
      showToast(msg, 'error');
      return;
    }

    if (designatingUserModal.mode === 'create') {
      const exists = admins.some(
        (a) => a.username.trim().toLowerCase() === cleanUsername.toLowerCase()
      );
      if (exists) {
        const msg = 'Já existe um usuário com este Nome de Usuário.';
        setModalError(msg);
        showToast(msg, 'error');
        return;
      }
      const created = {
        id: `adm-${Date.now()}`,
        username: cleanUsername,
        password: cleanPassword,
        role: cleanRole,
        isMaster: false,
        permissions: syncedPerms
      };
      setAdmins((prev) => [...prev, created]);
      setDesignatingUserModal(null);
      setActiveTab('admin');
      setAdminSubTab('admins');
      showToast(`Novo usuário "${created.username}" criado com sucesso!`);
      return;
    }

    setAdmins((prev) =>
      prev.map((adm) =>
        adm.id === designatingUserModal.id
          ? {
              ...adm,
              username: cleanUsername,
              password: cleanPassword,
              role: cleanRole,
              permissions: syncedPerms
            }
          : adm
      )
    );
    showToast(`Funções de "${cleanUsername}" salvas com sucesso!`);
    setDesignatingUserModal(null);
  };

  const handleRemoveAdmin = (adm) => {
    if (!currentAdmin?.isMaster) {
      showToast('Somente o Administrador Mestre pode remover usuários.', 'error');
      return;
    }
    if (adm.isMaster) {
      showToast('A conta Mestre é vitalícia e não pode ser removida.', 'error');
      return;
    }
    setConfirmModal({
      title: 'Remover Usuário',
      message: `Deseja realmente revogar o acesso de "${adm.username}"?`,
      onConfirm: () => {
        setAdmins((prev) => prev.filter((item) => item.id !== adm.id));
        setConfirmModal(null);
        showToast('Acesso removido.');
      }
    });
  };

  const handleDeleteRegistration = (reg) => {
    if (!hasPermission('inscritos_excluir')) {
      showToast('Seu usuário não tem permissão para remover inscrições.', 'error');
      return;
    }
    setConfirmModal({
      title: 'Cancelar Inscrição',
      message: `Deseja cancelar a inscrição de ${reg.name} (${reg.protocol})?`,
      onConfirm: () => {
        setRegistrations((prev) => prev.filter((r) => r.id !== reg.id));
        setActivities((prev) =>
          prev.map((act) =>
            reg.selectedActivityIds.includes(act.id) && act.enrolledCount > 0
              ? { ...act, enrolledCount: act.enrolledCount - 1 }
              : act
          )
        );
        setConfirmModal(null);
        showToast('Inscrição cancelada.');
      }
    });
  };

  const handleToggleActivitySelection = (actId) => {
    setRegForm((prev) => {
      const exists = prev.selectedActivityIds.includes(actId);
      if (exists) {
        return {
          ...prev,
          selectedActivityIds: prev.selectedActivityIds.filter((id) => id !== actId)
        };
      }
      return {
        ...prev,
        selectedActivityIds: [...prev.selectedActivityIds, actId]
      };
    });
  };

  const handleQuickSelectFromSchedule = (actId) => {
    setRegForm((prev) => {
      const exists = prev.selectedActivityIds.includes(actId);
      return {
        ...prev,
        selectedActivityIds: exists
          ? prev.selectedActivityIds
          : [...prev.selectedActivityIds, actId]
      };
    });
    setActiveTab('register');
    showToast('Atividade selecionada no seu formulário de inscrição!');
  };

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (!digits) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (registrationBusy) return;
    if (!regForm.name.trim() || !regForm.email.trim() || !regForm.cpfOrId.trim() || !regForm.course.trim() || !regForm.institution.trim() || !/^\(\d{2}\) \d{5}-\d{4}$/.test(regForm.phone)) {
      showToast('Preencha todos os dados e o telefone no formato (00) 99999-9999.', 'error'); return;
    }
    if (participantPassword.length < 8 || participantPassword !== participantPasswordConfirm) {
      showToast('A senha deve ter ao menos 8 caracteres e coincidir com a confirmação.', 'error'); return;
    }
    if (!regForm.selectedActivityIds.length) {
      showToast('Selecione ao menos uma atividade.', 'error'); return;
    }
    if (regForm.selectedActivityIds.some(id => !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))) {
      showToast('A programação ainda não foi carregada do Supabase. Atualize e selecione uma atividade publicada.', 'error'); return;
    }
    setRegistrationBusy(true);
    try {
      // Cliente separado: não substitui a sessão de um organizador que esteja testando o site.
      const { createClient } = await import('@supabase/supabase-js');
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const client = createClient(url, key, {auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
      const email = regForm.email.trim().toLowerCase();
      // Reaproveita contas criadas em tentativas anteriores: o Auth pode ter
      // cadastrado o usuário mesmo quando a gravação da inscrição falhou.
      let authSession = null;
      const {data:signup,error:signupError} = await client.auth.signUp({email,password:participantPassword});
      if (!signupError && signup?.session) {
        authSession = signup.session;
      } else {
        // Não trate uma conta existente como nova nem mostre sucesso sem RPC.
        // Em projetos com confirmação de e-mail ativa, signUp pode retornar
        // um usuário sem sessão. O login esclarece se já existe uma conta.
        const {data:login,error:loginError} = await client.auth.signInWithPassword({email,password:participantPassword});
        if (loginError || !login?.session) {
          if (signupError && !/already registered|already exists|already been registered/i.test(signupError.message || '')) {
            throw signupError;
          }
          throw new Error('Este e-mail já possui uma conta, ou precisa ser confirmado. Para concluir a inscrição, informe a senha usada no primeiro cadastro. Se não souber a senha, solicite a redefinição antes de tentar novamente.');
        }
        authSession = login.session;
      }
      if (!authSession) throw new Error('Não foi possível autenticar o participante. Verifique as configurações de confirmação de e-mail do Supabase.');
      const {data,error} = await client.rpc('seacom_register_participant',{
        p_activity_ids:regForm.selectedActivityIds,
        p_course:regForm.course.trim(),
        p_full_name:regForm.name.trim(),
        p_institution:regForm.institution.trim(),
        p_phone:regForm.phone,
        p_student_id:regForm.cpfOrId.trim()
      });
      if (error) throw error;
      const result = Array.isArray(data) ? data[0] : data;
      const protocol = typeof result === 'string' ? result : result?.protocol;
      if (!protocol) throw new Error('O banco não retornou o protocolo da inscrição. Verifique a função SQL.');
      setCompletedRegistration({...regForm,protocol});
      setParticipantPassword(''); setParticipantPasswordConfirm('');
      showToast('Inscrição confirmada e salva! Sua presença na palestra será registrada separadamente pelo QR Code. Protocolo: '+protocol);
      window.dispatchEvent(new Event('seacom:content-updated'));
    } catch (err) {
      const msg = err?.message || 'Erro desconhecido';
      showToast('Não foi possível concluir a inscrição: '+msg, 'error');
    } finally { setRegistrationBusy(false); }
  };

  const handleLookupRegistration = (e) => {
    e.preventDefault();
    const q = lookupQuery.trim().toLowerCase();
    if (!q) return;
    const found = registrations.find(
      (r) =>
        r.protocol.toLowerCase() === q ||
        r.email.toLowerCase() === q ||
        r.cpfOrId.toLowerCase() === q
    );
    setLookupResult(found || null);
    setLookupAttempted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md">
          <div
            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-xl border text-sm font-medium ${
              toast.type === 'error'
                ? 'bg-rose-950 text-white border-rose-700'
                : toast.type === 'info'
                ? 'bg-indigo-950 text-white border-indigo-700'
                : 'bg-slate-900 text-white border-emerald-500/40'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">{confirmModal.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirmar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CRIAR/EDITAR USUÁRIO */}
      {designatingUserModal && currentAdmin?.isMaster && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveDesignatedUserModal}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 space-y-5"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                  {designatingUserModal.mode === 'create' ? 'Novo Usuário' : 'Editar Permissões'}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                  {designatingUserModal.mode === 'create'
                    ? 'Adicionar Usuário e Designar Funções'
                    : `Designar Funções: ${designatingUserModal.username}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDesignatingUserModal(null)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Usuário *</label>
                <input
                  type="text"
                  value={designatingUserModal.username}
                  onChange={(e) =>
                    setDesignatingUserModal({ ...designatingUserModal, username: e.target.value })
                  }
                  placeholder="Ex: imprensa"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Senha *</label>
                <input
                  type="text"
                  value={designatingUserModal.password}
                  onChange={(e) =>
                    setDesignatingUserModal({ ...designatingUserModal, password: e.target.value })
                  }
                  placeholder="Ex: Senha123@"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cargo</label>
                <input
                  type="text"
                  value={designatingUserModal.role}
                  onChange={(e) =>
                    setDesignatingUserModal({ ...designatingUserModal, role: e.target.value })
                  }
                  placeholder="Ex: Equipe de Notícias"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                O que este usuário pode fazer no site:
              </p>
              {PERMISSION_MODULES.map((mod) => {
                const isModuleActive = Boolean(designatingUserModal.permissions?.[mod.key]);
                return (
                  <div
                    key={mod.key}
                    className={`p-4 rounded-2xl border-2 transition space-y-3 ${
                      isModuleActive ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">{mod.label}</h4>
                        <p className="text-[11px] text-slate-500">{mod.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextState = !isModuleActive;
                          const updatedPerms = { ...designatingUserModal.permissions };
                          mod.actions.forEach((a) => {
                            updatedPerms[a.key] = nextState;
                          });
                          setDesignatingUserModal({
                            ...designatingUserModal,
                            permissions: syncModulePermissions(updatedPerms)
                          });
                        }}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold transition shrink-0 ${
                          isModuleActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isModuleActive ? 'Liberado' : 'Liberar'}
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/70">
                      {mod.actions.map((act) => {
                        const checked = Boolean(designatingUserModal.permissions?.[act.key]);
                        return (
                          <button
                            key={act.key}
                            type="button"
                            onClick={() => {
                              const updatedPerms = {
                                ...designatingUserModal.permissions,
                                [act.key]: !checked
                              };
                              setDesignatingUserModal({
                                ...designatingUserModal,
                                permissions: syncModulePermissions(updatedPerms)
                              });
                            }}
                            className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 text-xs font-semibold transition ${
                              checked ? 'bg-white border-indigo-500 text-indigo-950 shadow-sm' : 'bg-white/60 border-slate-200 text-slate-500'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                                checked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                              }`}
                            >
                              {checked && <Check className="w-3 h-3" />}
                            </div>
                            <span>{act.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDesignatingUserModal(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Permissões</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BARRA DE ADMIN ATIVO */}
      {currentAdmin && (
        <div className="bg-indigo-950 text-indigo-100 px-4 py-2.5 text-xs border-b border-indigo-800/60">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-white">Admin Ativo:</span>
              <span className="font-bold text-amber-300">{currentAdmin.username}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {currentAdmin.isMaster ? (
                <button
                  type="button"
                  onClick={handleOpenCreateUserModal}
                  className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold flex items-center gap-1.5 shadow-sm transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Adicionar Usuário & Designar Funções</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const master = admins.find((a) => a.isMaster);
                    if (master) {
                      setCurrentAdminId(master.id);
                      setActiveTab('admin');
                      setAdminSubTab('admins');
                      showToast('Voltou para a conta Mestre!');
                    }
                  }}
                  className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold flex items-center gap-1.5 shadow-sm transition"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Voltar para João Henrique Silva</span>
                </button>
              )}
              <button onClick={() => setActiveTab('admin')} className="underline hover:text-white font-medium">
                Painel Admin
              </button>
              <button
                onClick={() => {
                  setCurrentAdminId(null);
                  showToast('Sessão encerrada.', 'info');
                }}
                className="flex items-center gap-1 text-rose-300 hover:text-rose-200 font-medium"
              >
                <LogOut className="w-3.5 h-3.5" /> Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 text-left group focus:outline-none"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  {siteConfig.acronym}
                </span>
                <span className="hidden sm:inline-block text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  {siteConfig.edition}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium line-clamp-1">{siteConfig.fullName}</p>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60">
            {[
              { id: 'home', label: 'Início', icon: Sparkles },
              { id: 'schedule', label: 'Programação', icon: Calendar, badge: activities.length },
              { id: 'news', label: 'Notícias', icon: Newspaper, badge: newsList.length },
              { id: 'register', label: 'Inscrição', icon: UserCheck }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveTab('register')}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-500/20 transition"
            >
              <span>Inscreva-se</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition ${
                activeTab === 'admin'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : currentAdmin
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span className="hidden lg:inline">{currentAdmin ? 'Painel Admin' : 'Área Admin'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main className="flex-1">
        {/* ABA HOME */}
        {activeTab === 'home' && (
          <div>
            {homeSections.filter(section => section.visible !== false).map(section => {
              if (section.type === 'hero') return <React.Fragment key={section.id}>
            <section className="relative overflow-hidden bg-slate-950 text-white py-16 lg:py-24" style={siteConfig.coverUrl ? {backgroundImage:`linear-gradient(90deg, rgba(2,6,23,.94),rgba(2,6,23,.72)),url(${siteConfig.coverUrl})`,backgroundPosition:"center",backgroundSize:"cover"} : undefined}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-12 gap-12 items-center">
                  <div className="lg:col-span-7 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{siteConfig.heroBadge}</span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300">
                        {siteConfig.acronym}:
                      </span>{' '}
                      {siteConfig.heroTitle}
                    </h1>
                    <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl">
                      {siteConfig.heroSubtitle}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 pt-3">
                      <button
                        onClick={() => setActiveTab('register')}
                        className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
                      >
                        <span>Fazer Minha Inscrição Agora</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setActiveTab('schedule')}
                        className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/15 flex items-center gap-2 transition"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Explorar Programação</span>
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-5">
                    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                            Panorama
                          </span>
                          <h2 className="text-xl font-bold text-white mt-0.5">{siteConfig.fullName}</h2>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                          <Mic className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4">
                          <span className="text-2xl sm:text-3xl font-extrabold text-white">
                            {stats.panelsCount}
                          </span>
                          <p className="text-xs text-slate-400 mt-1 font-medium">Painéis</p>
                        </div>
                        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4">
                          <span className="text-2xl sm:text-3xl font-extrabold text-indigo-400">
                            {stats.roundtablesCount}
                          </span>
                          <p className="text-xs text-slate-400 mt-1 font-medium">Mesas Redondas</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
              </React.Fragment>;
              if (section.type === 'about') return <React.Fragment key={section.id}>
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-4"><h2 className="text-3xl font-extrabold text-slate-900">Sobre a SEACOM 2026</h2><p className="max-w-3xl text-slate-600 leading-relaxed">{siteConfig.aboutText}</p><div className="grid md:grid-cols-3 gap-4 pt-4"><div className="rounded-2xl bg-white border p-5"><strong>Programação</strong><p className="text-sm text-slate-600 mt-2">Palestras, oficinas e mesas redondas</p></div><div className="rounded-2xl bg-white border p-5"><strong>Comunicação</strong><p className="text-sm text-slate-600 mt-2">Notícias e atualizações do evento</p></div><div className="rounded-2xl bg-white border p-5"><strong>Participação</strong><p className="text-sm text-slate-600 mt-2">Atividades e registro de presença</p></div></div></section>
              </React.Fragment>;
              if (section.type === 'schedule') return <section key={section.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><span className="text-xs font-bold uppercase tracking-widest text-indigo-600">SEACOM 2026</span><h2 className="text-3xl font-extrabold text-slate-900">Programação</h2></div><button type="button" onClick={() => setActiveTab('schedule')} className="rounded-xl bg-indigo-700 text-white px-5 py-3 font-semibold">Ver programação completa →</button></div><div className="grid gap-4 md:grid-cols-3">{activities.slice(0,3).map(a=><div key={a.id} className="bg-white border border-slate-200 rounded-2xl p-5"><h3 className="font-bold text-slate-900">{a.title}</h3><p className="text-sm text-slate-600 mt-2">{a.description || 'Confira os detalhes na programação.'}</p></div>)}{activities.length===0&&<p className="text-slate-600">Programação em atualização.</p>}</div></section>;
              if (section.type === 'news') return <section key={section.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-3xl font-extrabold text-slate-900">Últimas notícias</h2><button type="button" onClick={() => setActiveTab('news')} className="rounded-xl bg-indigo-700 text-white px-5 py-3 font-semibold">Ver todas as notícias →</button></div><div className="grid gap-4 md:grid-cols-3">{newsList.slice(0,3).map(n=><article key={n.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden"><img src={n.imageUrl} alt={n.title} className="w-full aspect-[4/3] object-cover"/><div className="p-5"><h3 className="font-bold text-slate-900">{n.title}</h3><p className="text-sm text-slate-600 mt-2">{n.summary}</p><button type="button" onClick={() => openArticle(n.id)} className="mt-3 text-sm font-bold text-indigo-700 hover:underline">Ler matéria completa →</button></div></article>)}{newsList.length===0&&<p className="text-slate-600">Nenhuma notícia publicada.</p>}</div></section>;
              if (section.type === 'register') return <section key={section.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"><div className="rounded-3xl bg-indigo-950 text-white p-8 sm:p-12 flex flex-col md:flex-row gap-6 md:items-center md:justify-between"><div><h2 className="text-3xl font-extrabold">Participe da SEACOM 2026</h2><p className="text-indigo-100 mt-3">Acesse a área de inscrições para escolher suas atividades.</p></div><button type="button" onClick={() => setActiveTab('register')} className="rounded-xl bg-white text-indigo-950 px-6 py-3 font-bold">Ir para inscrições →</button></div></section>;
              if (section.type === 'text') return <section key={section.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"><div className="bg-white border border-slate-200 rounded-3xl p-7 sm:p-10"><h2 className="text-2xl font-extrabold text-slate-900 mb-3">{section.title || 'Informações'}</h2><p className="whitespace-pre-line text-slate-600 leading-relaxed">{section.body || ''}</p></div></section>;
              return null;
            })}
          </div>
        )}

        {/* ABA PROGRAMAÇÃO */}
        {activeTab === 'schedule' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white mb-8 shadow-lg">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full">
                Cronograma Oficial • {siteConfig.acronym}
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold mt-3">Programação de Painéis e Mesas Redondas</h1>
              <p className="mt-3 text-sm text-indigo-100" role="status">
                {programacaoStatus === 'carregando' && 'Verificando programação do Supabase...'}
                {programacaoStatus === 'sem-configuracao' && `Supabase não configurado: ${programacaoErro} Exibindo programação demonstrativa.`}
                {programacaoStatus === 'conectado' && (activities.length ? 'Programação publicada no Supabase.' : 'Nenhuma atividade publicada no momento.')}
                {programacaoStatus === 'erro' && `Não foi possível consultar o Supabase: ${programacaoErro}. Exibindo dados demonstrativos.`}
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <button
                  onClick={() => setSelectedDayFilter('all')}
                  className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition border ${
                    selectedDayFilter === 'all'
                      ? 'bg-white text-slate-950 border-white shadow-md'
                      : 'bg-white/10 text-white border-white/15'
                  }`}
                >
                  Todos os Dias ({activities.length})
                </button>
                {siteConfig.days.map((day) => {
                  const isSelected = selectedDayFilter === day.id;
                  return (
                    <button
                      key={day.id}
                      onClick={() => setSelectedDayFilter(day.id)}
                      className={`px-4 py-2.5 rounded-2xl text-left transition border ${
                        isSelected
                          ? 'bg-indigo-500 text-white border-indigo-300 shadow-md'
                          : 'bg-white/10 text-white border-white/15'
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-bold block">
                        {day.label} — {day.date}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm mb-8 flex flex-col md:flex-row justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {['all', 'Painel', 'Mesa Redonda', 'Oficina'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      selectedTypeFilter === type ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {type === 'all' ? 'Todos os Formatos' : type}
                  </button>
                ))}
              </div>
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={scheduleSearch}
                  onChange={(e) => setScheduleSearch(e.target.value)}
                  placeholder="Buscar por tema ou palestrante..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>

            <div className="space-y-6">
              {filteredActivities.map((act) => {
                const day = getDayInfo(act.dayId);
                const isAlreadySelected = regForm.selectedActivityIds.includes(act.id);
                return (
                  <div key={act.id} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                    <div className="flex flex-col lg:flex-row justify-between gap-6">
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getBadgeStyle(act.type)}`}>
                            {act.type}
                          </span>
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800">
                            {day.displayLabel} — {day.date || act.date}
                          </span>
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700">
                            {act.startTime} às {act.endTime}
                          </span>
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-900">{act.title}</h3>
                        <p className="text-sm text-slate-600">{act.description}</p>
                        <p className="text-xs font-bold text-indigo-900">Palestrantes: {act.speakers}</p>
                      </div>
                      <div className="lg:w-72 shrink-0 bg-slate-50 rounded-2xl p-5 border flex flex-col justify-between space-y-4">
                        <span className="text-xs text-slate-700 block font-semibold">{act.location}</span>
                        <button
                          onClick={() => handleQuickSelectFromSchedule(act.id)}
                          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                            isAlreadySelected ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                          }`}
                        >
                          {isAlreadySelected ? 'Selecionado' : 'Selecionar para Inscrição'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ABA NOTÍCIAS (Mural com Fotos em Proporção 4:3 estrita) */}
        {activeTab === 'news' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900">Notícias e Comunicados</h1>
              {hasPermission('noticias') && (
                <button
                  onClick={() => {
                    setActiveTab('admin');
                    setAdminSubTab('news');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Publicar Notícia
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newsList.map((n) => (
                <article key={n.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                  {/* Proporção estrita 4:3 */}
                  <div className="aspect-[4/3] bg-slate-900 relative overflow-hidden">
                    <img
                      src={n.imageUrl}
                      alt={n.title}
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/600x450/1e1b4b/ffffff?text=SEACOM';
                      }}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white">
                      {n.category}
                    </span>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block mb-2">{n.date}</span>
                      <h2 className="text-lg font-bold text-slate-900 mb-2">{n.title}</h2>
                      <p className="text-xs sm:text-sm text-slate-600 line-clamp-3">{n.summary}</p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <button
                        onClick={() => openArticle(n.id)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Ler matéria completa
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Página própria da notícia, com URL compartilhável e histórico do navegador */}
        {activeTab === 'article' && (() => {
          const n = newsList.find(item => String(item.id) === articleId);
          return <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 min-h-[50vh]">
            <button type="button" onClick={() => setActiveTab('news')} className="mb-6 text-indigo-700 font-semibold hover:underline">← Voltar às notícias</button>
            {n ? <article className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
              <img src={n.imageUrl} alt={n.title} className="w-full aspect-[4/3] object-cover" />
              <div className="p-6 sm:p-10 space-y-5">
                <p className="text-sm text-slate-500">{n.date}</p>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">{n.title}</h1>
                <p className="text-lg text-slate-600">{n.summary}</p>
                <div className="seacom-richtext text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{__html:newsToHtml(n.content||'')}} />
              </div>
            </article> : <div className="rounded-2xl border p-8 text-slate-600">Notícia não encontrada ou ainda não publicada.</div>}
          </main>;
        })()}

        {/* ABA INSCRIÇÃO */}
        {activeTab === 'register' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                {completedRegistration ? (
                  <div className="bg-white rounded-3xl border-2 border-emerald-500/40 p-6 sm:p-10 shadow-xl space-y-6">
                    <div className="flex justify-between items-center border-b pb-6">
                      <h2 className="text-2xl font-extrabold text-slate-900">Inscrição Confirmada!</h2>
                      <span className="font-mono font-extrabold text-sm text-emerald-600">
                        {completedRegistration.protocol}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-800">Participante: {completedRegistration.name}</p>
                    <button
                      onClick={() => setCompletedRegistration(null)}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                    >
                      Nova Inscrição
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRegisterSubmit} className="bg-white rounded-3xl border p-6 sm:p-8 shadow-sm space-y-8">
                    <h1 className="text-2xl font-extrabold text-slate-900">Ficha de Inscrição</h1>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
                        <input
                          type="text"
                          required
                          value={regForm.name}
                          onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border text-sm"
                        />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">E-mail *</label>
                          <input
                            type="email"
                            required
                            value={regForm.email}
                            onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Matrícula / CPF *</label>
                          <input
                            type="text"
                            required
                            value={regForm.cpfOrId}
                            onChange={(e) => setRegForm({ ...regForm, cpfOrId: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold text-slate-700 mb-1">Telefone *</label><input type="tel" required inputMode="numeric" autoComplete="tel-national" placeholder="(00) 99999-9999" maxLength={15} pattern="\([0-9]{2}\) [0-9]{5}-[0-9]{4}" title="Digite o telefone no formato (00) 99999-9999" value={regForm.phone} onChange={e=>setRegForm({...regForm,phone:formatPhone(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border text-sm"/></div>
                        <div><label className="block text-xs font-bold text-slate-700 mb-1">Curso *</label><input type="text" required maxLength={120} placeholder="Ex.: Jornalismo" value={regForm.course} onChange={e=>setRegForm({...regForm,course:e.target.value})} className="w-full px-4 py-2.5 rounded-xl border text-sm"/></div>
                      </div>
                      <div><label className="block text-xs font-bold text-slate-700 mb-1">Instituição *</label><input type="text" required maxLength={150} placeholder="Ex.: Universidade Federal do Acre" value={regForm.institution} onChange={e=>setRegForm({...regForm,institution:e.target.value})} className="w-full px-4 py-2.5 rounded-xl border text-sm"/></div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="participant-password" className="block text-xs font-bold text-slate-700 mb-1">Criar senha *</label>
                          <input id="participant-password" type={showParticipantPassword ? 'text' : 'password'} required minLength={8} autoComplete="new-password" placeholder="Mínimo de 8 caracteres" value={participantPassword} onChange={e=>setParticipantPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border text-sm"/>
                        </div>
                        <div>
                          <label htmlFor="participant-password-confirm" className="block text-xs font-bold text-slate-700 mb-1">Confirmar senha *</label>
                          <input id="participant-password-confirm" type={showParticipantPassword ? 'text' : 'password'} required minLength={8} autoComplete="new-password" placeholder="Repita a senha" value={participantPasswordConfirm} onChange={e=>setParticipantPasswordConfirm(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border text-sm"/>
                        </div>
                      </div>
                      <label className="inline-flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" checked={showParticipantPassword} onChange={e=>setShowParticipantPassword(e.target.checked)}/> Mostrar senhas</label>
                      <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">Ao clicar em Confirmar Inscrição, seu cadastro e sua vaga na atividade serão registrados imediatamente. O QR Code é utilizado depois, somente para registrar presença. A confirmação por e-mail está desativada durante os testes privados.</p>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                        Selecione as Atividades * ({regForm.selectedActivityIds.length} selecionadas • {selectedTotalWorkloadHours}h)
                      </h2>
                      <div className="space-y-3">
                        {activities.map((act) => {
                          const isChecked = regForm.selectedActivityIds.includes(act.id);
                          const day = getDayInfo(act.dayId);
                          return (
                            <div
                              key={act.id}
                              onClick={() => handleToggleActivitySelection(act.id)}
                              className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3.5 ${
                                isChecked ? 'border-indigo-600 bg-indigo-50/40' : 'border-slate-200 bg-white'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 border ${
                                  isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                                }`}
                              >
                                {isChecked && <Check className="w-3.5 h-3.5" />}
                              </div>
                              <div>
                                <span className="text-[11px] font-bold text-indigo-700">
                                  {act.type} • {day.label} ({day.date})
                                </span>
                                <h3 className="text-sm font-bold text-slate-900">{act.title}</h3>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={registrationBusy}
                      className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-extrabold text-sm shadow-lg disabled:opacity-60"
                    >
                      {registrationBusy ? "Salvando inscrição..." : "Confirmar Inscrição"}
                    </button>
                  </form>
                )}
              </div>

              <div className="lg:col-span-4">
                <div className="bg-white rounded-3xl border p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900">Consultar Inscrição</h3>
                  <form onSubmit={handleLookupRegistration} className="space-y-2.5">
                    <input
                      type="text"
                      value={lookupQuery}
                      onChange={(e) => setLookupQuery(e.target.value)}
                      placeholder="Protocolo ou e-mail..."
                      className="w-full px-3.5 py-2.5 rounded-xl border text-xs"
                    />
                    <button type="submit" className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold">
                      Buscar
                    </button>
                  </form>
                  {lookupAttempted && lookupResult && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs">
                      <p className="font-bold text-emerald-900">{lookupResult.name}</p>
                      <p className="font-mono font-bold text-emerald-800">{lookupResult.protocol}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Administração autenticada via Supabase Auth */}
        {activeTab === 'admin' && <AdminSeguro />}
      </main>

      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 py-10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-xs text-center">
          {siteConfig.acronym} — {siteConfig.fullName}
        </div>
      </footer>
    </div>
  );
}