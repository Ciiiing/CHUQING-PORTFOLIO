import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import RippleVideo from './RippleVideo'
import ShinyText from './ShinyText'
import ProjectAccordion from './ProjectAccordion'
import FlowingMenu from './FlowingMenu'
import SectionPrelude from './SectionPrelude'
import TiltedCard from './TiltedCard'
import DepthCarousel from './DepthCarousel'
import DriftWall from './DriftWall'
import CircularGallery from './CircularGallery'
import LineSidebar from './LineSidebar'
import ScrollStack, { ScrollStackItem } from './ScrollStack'
import ProjectDetailModal from './ProjectDetailModal'
import {
  ArrowLeft,
  ArrowUp,
  ArrowUpRight,
  Menu,
  X,
} from 'lucide-react'
import './styles.css'

gsap.registerPlugin(ScrollTrigger)

const asset = (name) => `${import.meta.env.BASE_URL}assets/${name}`

const copyRect = (element) => {
  if (!element) return null
  const { left, top, width, height } = element.getBoundingClientRect()
  return { left, top, width, height }
}

const animateModalFromCover = (node, openingRect) => {
  if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null
  const target = node.getBoundingClientRect()
  const hasSource = openingRect?.width > 0 && openingRect?.height > 0
  const from = hasSource
    ? {
        x: openingRect.left - target.left,
        y: openingRect.top - target.top,
        scaleX: Math.max(.08, openingRect.width / target.width),
        scaleY: Math.max(.08, openingRect.height / target.height),
        autoAlpha: .82,
      }
    : { scale: .9, y: 18, autoAlpha: 0 }

  return gsap.fromTo(node, from, {
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    autoAlpha: 1,
    duration: .68,
    ease: 'power4.out',
    transformOrigin: 'top left',
    overwrite: true,
  })
}

const animateModalToCover = (node, openingRect, onComplete) => {
  if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    onComplete()
    return null
  }
  const target = node.getBoundingClientRect()
  const hasSource = openingRect?.width > 0 && openingRect?.height > 0
  return gsap.to(node, {
    x: hasSource ? openingRect.left - target.left : 0,
    y: hasSource ? openingRect.top - target.top : 14,
    scaleX: hasSource ? Math.max(.08, openingRect.width / target.width) : .9,
    scaleY: hasSource ? Math.max(.08, openingRect.height / target.height) : .9,
    autoAlpha: 0,
    duration: .46,
    ease: 'power3.in',
    transformOrigin: 'top left',
    overwrite: true,
    onComplete,
  })
}

const english = {
  '项目': 'Projects',
  '经历': 'Experience',
  '作品': 'Works',
  '关于': 'About',
  '能力': 'Capabilities',
  '回到首页': 'Back to top',
  '主导航': 'Primary navigation',
  '打开菜单': 'Open menu',
  '关闭菜单': 'Close menu',
  '联系我': 'Contact',
  '语言切换': 'Language switcher',
  '中文': 'Chinese',
  '英文': 'English',
  '返回经历': 'Back to experience',
  '详情暂未开放': 'Details will be added here later',
  '褚清 / CHU QING': 'CHU QING',
  '品牌传播、策划运营、产品推进与项目研究。': 'Brand communication, campaign operations, product delivery, and project research.',
  '查看项目': 'View projects',
  '了解我': 'About me',
  '关于我': 'About',
  'Creative Strategist · Brand Communication · Visual Storytelling': 'Creative Strategist · Brand Communication · Visual Storytelling',
  '创意策略｜品牌传播｜视觉叙事': 'Creative Strategy | Brand Communication | Visual Storytelling',
  '我是一名专注于品牌传播与数字内容创新的创意实践者，拥有新闻传播、视觉设计、新媒体运营与品牌服务的复合背景。': 'I am a creative practitioner focused on brand communication and digital content innovation, with a hybrid background in journalism and communication, visual design, new media operations, and brand services.',
  '我的创作始终围绕“如何让信息被理解、被记住、被传播”展开。从用户洞察、内容策划，到视觉表达与传播执行，我习惯以策略思维拆解问题，并通过创意方式寻找解决方案。': 'My work always begins with one question: how can information be understood, remembered, and shared? From user insight and content planning to visual expression and communication execution, I break problems down strategically and look for solutions through creative thinking.',
  '在过去的学习与实践中，我参与过品牌策划、新媒体运营、视觉设计、数字内容制作等项目，逐渐形成了从内容研究到创意落地的完整工作方式。我相信，好的创意不仅需要美感，更需要回应真实需求，连接人与品牌之间的关系。': 'Through study and practice, I have worked across brand planning, new media operations, visual design, and digital content production. This has shaped a complete way of working from content research to creative delivery. I believe good ideas need more than beauty: they should answer real needs and connect people with brands.',
  '关于照片': 'Portrait of Chu Qing',
  '判断、转译与推进': 'Judgment, translation, and delivery',
  '从复杂信息中提炼判断，': 'Extract judgment from complexity,',
  '把判断推进为结果。': 'then turn judgment into outcomes.',
  '我的核心优势，是能在陌生问题里快速建立结构：识别关键变量，理解业务与用户，再把判断拆成内容、流程和视觉语言。': 'My core strength is building structure quickly in unfamiliar problems: identifying critical variables, understanding both business and users, then translating judgment into content, workflows, and visual language.',
  '这让我能在品牌传播、策划运营、产品协作和项目研究之间保持连续思考，并把方案推进到真实交付。': 'This lets me think continuously across brand communication, campaign operations, product collaboration, and project research, while carrying ideas through to real delivery.',
  '洞察': 'INSIGHT',
  '策划运营': 'OPERATIONS',
  '推进': 'DELIVERY',
  '表达': 'EXPRESSION',
  '精选项目': 'Selected projects',
  '四个项目，四种推进路径。': 'Four projects, four ways of moving work forward.',
  '知源葡萄酒品牌策划与视觉体系设计': 'Zhi Yuan Wine Brand Strategy and Visual Identity Design',
  '正山堂茶文化品牌出海策划与空间体验设计': 'Zheng Shan Tang Tea Culture Overseas Strategy and Spatial Experience Design',
  '融媒体直播项目管理体系搭建与SOP设计': 'Converged Media Live Project Management System and SOP Design',
  '中国电影120周年数据新闻与交互可视化设计': 'Chinese Cinema 120th Anniversary Data Journalism and Interactive Visualization Design',
  '浏览项目，当前项目再次点击可查看详情': 'Browse projects. Click the active project again to view details',
  '实习经历': 'Experience',
  '在真实业务节奏里，逐步扩大负责范围。': 'Growing the scope of ownership in real business environments.',
  '作品选辑': 'Selected works',
  '视频、平面与书册的作品归档。': 'An archive of moving image, graphic work, and books.',
  '视频作品': 'Moving Image',
  '平面作品': 'Graphic works',
  '书册作品': 'Books & Editorial',
  '11部影像作品': '11 moving-image works',
  '图像与版式': 'Image and layout',
  '编辑与书册': 'Editorial and books',
  '平面、编辑、活动视觉与影像。': 'Graphic, editorial, event, and moving-image work.',
  '视觉滚动墙': 'Visual archive',
  '悬停暂停 · 点击查看': 'Hover to pause · Click to view',
  '左右滑动 · 点击查看': 'Swipe · Tap to view',
  '继续滚动': 'Resume',
  '暂停滚动': 'Pause',
  '动态内容': 'Moving Image',
  '一些被镜头留下的现场。': 'Moments carried forward by the camera.',
  '能力结构': 'Capabilities',
  '项目管理': 'Project Management',
  '流程优化': 'Process Optimization',
  '内容策划': 'Content Strategy',
  '视觉设计': 'Visual Design',
  '视频剪辑': 'Video Editing',
  '沟通表达': 'Communication & Presentation',
  '英语能力': 'English Proficiency',
  '办公软件': 'Office Tools',
  '从问题定义到交付，保持完整链路。': 'A complete line from problem definition to delivery.',
  '开放新的合作与工作可能': 'Open to new roles and collaborations',
  '下一段经历，': 'The next chapter,',
  '也许可以一起创建': 'perhaps we can create it together',
  '策略 · 产品 · 视觉': 'STRATEGY · PRODUCT · VISUAL',
  '回到顶部': 'Back to top',
  '关闭': 'Close',
  '微纪录片-《我是楮先生》': 'Mini Documentary - Mr. Chu',
  '校园宣传片-《无名之人》': 'Campus Film - The Nameless',
  '影视混剪-《关于爱情》': 'Film Mashup - About Love',
  '微纪录片-《才华如何兑换现实》': 'Mini Documentary - Turning Talent into Reality',
  '校园宣传片-《社科大瞭望塔》': 'Campus Film - UCASS Watchtower',
  '影视混剪-《驴得水》': 'Film Mashup - Mr. Donkey',
  '影视混剪-《涉过愤怒的海》': 'Film Mashup - Across the Furious Sea',
  '运动宣传片-《篮梦·起航》': 'Sports Film - Basketball, Takeoff',
  'AE动效宣传片': 'Adobe After Effects Motion Graphics Promo',
  'Vlog-《校歌赛直播幕后》': 'Vlog - Campus Choir Livestream Backstage',
  'Vlog-《BIRTV 展会》': 'Vlog - BIRTV Exhibition',
  '视觉海报作品': 'Visual Poster Works',
  '品牌视觉练习': 'Brand Visual Exercises',
  '公益海报：幕后黑手': 'Public-interest Poster: The Hidden Hand',
  '主题视觉海报': 'Themed Visual Poster',
  '媒体融合十年主视觉': 'Ten Years of Media Convergence Key Visual',
  '元旦晚会主海报': 'New Year Gala Key Poster',
  '舞心所向主海报': 'Dance with Heart Key Poster',
  '舞心所向折页节目单': 'Dance with Heart Folded Program',
  '元宵节日贺图': 'Lantern Festival Greeting',
  '端午节日贺图': 'Dragon Boat Festival Greeting',
  '视觉记录一': 'Visual Record I',
  '视觉记录二': 'Visual Record II',
  '视觉记录三': 'Visual Record III',
  '视觉记录四': 'Visual Record IV',
  '排球协会招新海报': 'Volleyball Association Recruitment Poster',
  '阳和杯赛事海报': 'Yanghe Cup Event Poster',
  '融媒体实验室介绍展板': 'Converged Media Lab Display Board',
  'UCG校园赛主视觉': 'UCG Campus Tournament Key Visual',
  '艺术节活动海报': 'Arts Festival Poster',
  '元旦节日贺图': 'New Year Greeting',
  '融媒体社招新海报': 'Converged Media Society Recruitment Poster',
  '知源葡萄酒品牌宣传册': 'Zhi Yuan Wine Brand Brochure',
  '从长城到敦煌：文化遗址的故事': 'From the Great Wall to Dunhuang: Stories of Cultural Heritage',
  '杂志《帧·探》': 'Frame Probe Magazine',
  '电子报《新声报》': 'New Voice Newsletter',
  '社科大新传学院招新宣传册': 'UCASS School of Journalism and Communication Recruitment Brochure',
  '2026.7-至今': 'Jul 2026 - Present',
  '2025.9-2026.6': 'Sep 2025 - Jun 2026',
  '2025.3-2025.8': 'Mar 2025 - Aug 2025',
  '2024.6-2024.9': 'Jun 2024 - Sep 2024',
  '2026.8.1-至今': '2026.8.1 - Present',
  '2025.9.8-2026.6.15': '2025.9.8 - 2026.6.15',
  '2025.6.17-2025.8.15': '2025.6.17 - 2025.8.15',
  '2024.7.8-2024.8.19': '2024.7.8 - 2024.8.19',
  '我的工作': 'My role',
  '作品选辑中的视觉与影像项目。后续可在此补充完整的项目说明、个人职责与交付链接。': 'A visual or moving-image project from the selected archive. A full project note, individual role, and delivery link can be added here.',
  '查看方式': 'Viewing',
  '点击关闭继续浏览': 'Close to continue browsing',
  '数据叙事 / 交互体验': 'Data storytelling / Interactive experience',
  [`中国电影 120 周年
交互数据叙事`]: `120 Years of Chinese Cinema
Interactive Data Story`,
  '中国电影 120 周年交互数据叙事': '120 Years of Chinese Cinema: Interactive Data Story',
  '把近 30 万条电影资料转译成可浏览的时间、人物与类型关系。': 'Translating nearly 300,000 film records into browsable relationships across time, people, and genre.',
  '研究 / 信息架构 / 内容策划': 'Research / Information architecture / Content strategy',
  '11 类可视化叙事模块': '11 visual storytelling modules',
  '从资料整理、字段清洗到内容结构和页面叙事，建立一套让复杂电影史能够被快速理解的交互路径。': 'From source organization and data cleaning to content structure and page narrative, I built an interactive path that makes a complex film history easier to understand.',
  '建立电影资料的时间、地域、类型与人物关系': 'Mapped relationships across time, region, genre, and people',
  '将研究结论拆成可进入、可回看的信息节点': 'Turned research findings into navigable information nodes',
  '兼顾历史内容的准确性与浏览节奏': 'Balanced historical accuracy with browsing rhythm',
  '项目管理 / 运营机制': 'Project management / Operating system',
  [`直转播项目运营与
PM SOP`]: `Live Production Operations
and PM SOP`,
  '直转播项目运营与 PM SOP': 'Live Production Operations and PM SOP',
  '将前期策划、现场执行、复盘沉淀成一份可复用的项目作战手册。': 'Turning planning, live execution, and retrospectives into a reusable operating manual.',
  '流程设计 / 跨团队协作 / 交付管理': 'Process design / Cross-team collaboration / Delivery management',
  '14 场直播活动经验沉淀': 'Experience distilled from 14 live productions',
  '以真实直转播工作流为基础，拆解角色边界、关键节点、风险检查和现场响应，让项目推进从依赖经验变成可协作的系统。': 'Based on real live-production workflows, I clarified role boundaries, critical milestones, risk checks, and on-site response so delivery could become a shared system rather than tacit experience.',
  '覆盖需求、脚本、排期、现场与复盘全周期': 'Covered requirements, scripts, scheduling, live execution, and retrospectives',
  '把隐性经验写成角色清晰的检查清单': 'Turned tacit knowledge into role-specific checklists',
  '用可视化节点帮助团队在高压现场快速判断': 'Used visual milestones to support fast decisions under pressure',
  '品牌策略 / 产品策划': 'Brand strategy / Product planning',
  [`“时光予你”
女性红酒品牌与产品策划`]: `Time for Yourself
Wine Brand and Product Strategy`,
  '“时光予你”女性红酒品牌与产品策划': 'Time for Yourself: Wine Brand and Product Strategy',
  '从女性用户洞察出发，把情绪价值、饮用场景和包装体验连成一个品牌。': 'Building a brand by connecting emotional value, drinking occasions, and packaging experience through user insight.',
  '用户洞察 / 品牌概念 / 包装与传播': 'User insight / Brand concept / Packaging and communication',
  '从命名到礼盒的完整提案': 'A complete proposal from naming to gift box',
  '围绕“给自己的时间”梳理目标人群、消费情境和表达语气，完成品牌故事、产品组合、礼盒结构及传播触点的统一设计。': 'Around the idea of time for yourself, I defined the audience, consumption moments, and tone, then aligned the brand story, product line, gift-box structure, and communication touchpoints.',
  '把用户情绪需求转译为可识别的品牌语气': 'Translated emotional needs into a recognizable brand voice',
  '设计适合送礼与自饮的产品层级': 'Designed product tiers for gifting and personal use',
  '将包装、内容与社交传播放在同一体验链路中': 'Connected packaging, content, and social communication in one experience',
  '2026 — 至今': '2026 — Present',
  '北京新意互动': 'CIG Beijing',
  '北京新意互动数字技术有限公司': 'Beijing Xinyi Interactive Digital Technology Co., Ltd.',
  '北京炬野文化传播发展有限公司': 'Juye Culture Communication and Development Co., Ltd.',
  '中青网新媒体科技（北京）有限公司': 'Zhongqing Network New Media Technology (Beijing) Co., Ltd.',
  '江西臻美文化传媒有限公司': 'Jiangxi Zhenmei Culture Media Co., Ltd.',
  '中国青年网': 'China Youth Network',
  '客户执行实习生': 'Account Executive Intern',
  '新媒体编辑': 'New Media Editor',
  '新媒体运营': 'New Media Operations',
  '策略 / 内容与视觉支持': 'Strategy / Content and visual support',
  '围绕通信、智能产品与品牌营销业务，参与产品调研、竞品分析、内容方案与品牌视觉交付。': 'Supported telecom, intelligent-product, and brand-marketing work through product research, competitive analysis, content planning, and visual delivery.',
  '25 家营业厅 + 53 户家庭调研': 'Research across 25 service halls and 53 households',
  '呦爱机器人 v0.1 → v3.0': 'YoAI Robot v0.1 → v3.0',
  '中国联通营销与竞品研究': 'China Unicom marketing and competitor research',
  '北京炬野文化传播': 'Beijing Juye Culture',
  '视觉设计': 'Visual design',
  '在赛事与活动节奏中完成直播包装、活动摄影和品牌物料，把视觉方案落到现场。': 'Delivered broadcast packages, event photography, and brand assets within the pace of live events.',
  '电竞赛事直播包装': 'Esports broadcast package',
  '京东 MALL 高校电竞季摄影': 'JD MALL Collegiate Esports Season Photography',
  '中青报·中青网': 'China Youth Daily · youth.cn',
  '新媒体编辑': 'New media editor',
  '参与青年内容策划、采访编辑与跨平台表达，在选题、写作和发布链路中完成内容交付。': 'Planned youth-focused content, edited interviews, and delivered stories across platforms from topic selection to publication.',
  '小红书内容运营': 'Rednote content operations',
  '播客《生活未修课》': 'Life Unfinished Podcast',
  '江西臻美文化传媒': 'Jiangxi Zhenmei Media',
  '新媒体运营': 'New media operations',
  '参与直播脚本、商品排序、现场流程与社群运营，熟悉从内容准备到用户反馈的执行链路。': 'Worked across live scripts, product sequencing, on-site workflows, and community operations from content preparation to user feedback.',
  '直播流程与物料准备': 'Live workflow and production materials',
  '微信群运营与反馈整理': 'Community operations and feedback synthesis',
  '让爱无碍 / 公共议题视觉': 'Love Without Barriers / Public-interest visual',
  '议题海报': 'Issue poster',
  '新闻传播历史文化长廊': 'History of Journalism and Communication Corridor',
  '编辑设计': 'Editorial design',
  '招生宣传册 / 信息编排': 'Admissions Brochure / Information design',
  '电竞赛事视觉系统': 'Esports Event Visual System',
  '活动视觉': 'Event visual',
  '社科大文创礼盒': 'UCASS Cultural Gift Box',
  '包装与文创': 'Packaging and cultural product',
  '文化主题专辑设计': 'Cultural Theme Album Design',
  '中国联通 / 寒露': 'China Unicom / Cold Dew',
  '品牌视觉': 'Brand visual',
  '“帧·探”视觉研究': 'Frame Probe Visual Study',
  '视觉系统': 'Visual system',
  '中国联通 / 霜降': 'China Unicom / Frost Descent',
  '中国联通 / 重阳': 'China Unicom / Double Ninth Festival',
  '校园舞台现场视觉': 'Campus Stage Visuals',
  '红酒礼盒 / 触点延展': 'Wine Gift Box / Touchpoint Extension',
  '《我是楮先生》': 'Mr. Chu',
  '微纪录片': 'Micro-documentary',
  'BIRTV 2025 宣传片': 'BIRTV 2025 Promotional Film',
  '机构宣传': 'Institutional Film',
  '篮球赛事内容片': 'Basketball Event Film',
  '活动影像': 'Event film',
  '直播现场与舞台记录': 'Live Production and Stage Documentation',
  '现场影像': 'Live documentation',
  '研究与分析': 'Research and analysis',
  '从样本、资料与竞品中找到问题结构，形成能继续推进的判断。': 'Find the structure of a problem through samples, sources, and competitors, then form judgments that move work forward.',
  '策略与内容': 'Strategy and content',
  '把抽象目标拆成清晰的内容主题、传播路径和用户触点。': 'Break abstract goals into clear content themes, communication paths, and user touchpoints.',
  '产品与项目推进': 'Product and project delivery',
  '梳理角色、节点和风险，让复杂协作可以被看见、被执行。': 'Clarify roles, milestones, and risks so complex collaboration becomes visible and executable.',
  '视觉与影像表达': 'Visual & Moving-Image Expression',
  '能独立完成从概念、排版到平面与视频交付的视觉表达。': 'Deliver visual expression independently from concept and layout to graphic and video output.',
}

const localize = (value, language) => language === 'en' ? english[value] ?? value : value

const projectGalleryItems = [
  {
    id: 'wine', label: '知源葡萄酒品牌策划与视觉体系设计', image: asset('project-wine-cover.png'),
    detail: {
      directPageSwitch: true,
      eyebrow: 'BRAND STRATEGY / 2025',
      chinese: {
        headerEyebrow: '知源葡萄酒品牌策划与视觉体系设计',
        headerTitle: 'ZHIYUAN WINE',
        eyebrow: '品牌策略 / 2025',
        title: '知源葡萄酒',
        disciplines: '品牌策略 · 视觉体系 · 品牌叙事',
        paragraphs: [
          '针对拥有百年酿造文化的丹凤葡萄酒品牌，本项目探索如何将传统文化资产转化为年轻化品牌价值。围绕“时光的翻译者与重塑者”的品牌理念，我从地域文化、消费场景与用户认知出发，构建品牌故事、产品体系与视觉表达。',
          '通过品牌策略梳理与视觉设计落地，将秦岭自然风物、东方美学意象与现代消费需求连接，打造兼具文化传承与当代表达的品牌体验。',
        ],
      },
      english: {
        headerEyebrow: 'ZHIYUAN WINE',
        headerTitle: 'Zhi Yuan Wine Brand Strategy and Visual Identity Design',
        eyebrow: 'BRAND STRATEGY / 2025',
        title: 'ZHIYUAN WINE',
        disciplines: 'Brand Strategy · Visual Identity · Storytelling',
        paragraphs: [
          'This project explores how to transform the cultural heritage of Danfeng’s century-old winemaking tradition into a contemporary brand value. Guided by the concept of “The Translator and Reshaper of Time”, I developed the brand narrative, product structure, and visual expression by examining regional culture, consumer scenarios, and user perceptions.',
          'By integrating brand strategy with visual design, the project connects the natural landscapes of the Qinling Mountains, oriental aesthetics, and modern consumer needs, creating a brand experience that balances cultural heritage with contemporary expression.',
        ],
      },
      brochurePages: [
        ...Array.from({ length: 11 }, (_, index) => ({
          number: String(index + 1).padStart(2, '0'),
          image: asset(`zhi-yuan-brochure-${String(index + 1).padStart(2, '0')}.png`),
        })),
      ],
    },
  },
  {
    id: 'tea', label: '正山堂茶文化品牌出海策划与空间体验设计', image: asset('project-tea-cover.png'),
    detail: {
      layout: 'split',
      image: asset('zhengshantang-detail.png'),
      chinese: {
        eyebrow: '品牌策略 / 空间体验 / 2025',
        title: '正山堂茶文化品牌出海策划与空间体验设计',
        displayTitle: '正山堂茶文化品牌出海策划与空间体验设计',
        disciplines: '品牌策略 · 文化传播 · 体验设计',
        paragraphs: [
          '针对中国茶品牌在国际市场传播中存在的文化表达单一、品牌体验不足等问题，本项目探索如何将传统茶文化转化为符合海外消费者认知的品牌价值。以法国巴黎为目标市场，围绕“松烟桂醇，正山新程”的品牌理念，我从文化定位、用户需求与消费场景出发，构建茶文化出海策略与线下体验空间。',
          '通过品牌叙事与空间设计的结合，项目以“清雅和合”为核心体验理念，将东方茶文化中的温润气质与现代商业空间融合。同时结合海外消费者的文化背景，对传统符号进行适度转译，打造兼具文化认同与国际传播力的茶文化体验。',
        ],
      },
      english: {
        eyebrow: 'BRAND STRATEGY / SPATIAL EXPERIENCE / 2025',
        title: 'ZHENGSHANTANG TEA',
        displayTitle: 'ZHENGSHANTANG TEA',
        disciplines: 'Brand Strategy · Cultural Communication · Experience Design',
        paragraphs: [
          'This project explores how to transform traditional Chinese tea culture into contemporary brand value for global audiences. Focusing on the Paris market, I developed a brand communication strategy and immersive retail experience around the concept of “Songyan Gui Chun, Zhengshan New Journey”, integrating cultural positioning, user needs, and consumer scenarios.',
          'By combining brand storytelling with spatial experience design, the project developed an immersive tea environment centered on “elegant harmony”. It reinterprets traditional Chinese tea aesthetics through a contemporary lens, creating a cultural experience that balances authenticity, accessibility, and global communication potential.',
        ],
      },
    },
  },
  {
    id: 'pm', label: '融媒体直播项目管理体系搭建与SOP设计', image: asset('project-live-sop-cover.jpg'),
    detail: {
      chinese: {
        headerEyebrow: '融媒体直播项目管理体系搭建与SOP设计',
        headerTitle: 'CONVERGENCE MEDIA LIVE PRODUCTION SYSTEM',
        eyebrow: '项目管理 / 运营设计 / 流程优化',
        title: '融媒体直播项目管理体系搭建与SOP设计',
        disciplines: '项目管理 · 运营设计 · 流程优化',
        paragraphs: [
          '针对校园融媒体团队在大型直播项目执行中存在的岗位职责模糊、流程依赖个人经验、团队协作效率不足等问题，本项目以直转播活动全流程为基础，探索如何通过标准化流程设计提升项目执行效率。我从项目管理视角出发，梳理直播筹备、执行与复盘阶段的关键节点，搭建涵盖岗位职责、任务清单、沟通机制与执行规范的SOP体系。',
          '通过项目流程拆解与管理机制设计，将原本依赖个人经验的直播执行模式转化为可复制、可迭代的标准化工作体系。以项目经理岗位为例，我建立从前期需求对接、资源协调、现场执行到后期归档复盘的完整工作流程，提升团队协作效率，并为后续同类项目提供可持续优化的管理框架。',
        ],
      },
      english: {
        headerEyebrow: 'CONVERGENCE MEDIA LIVE PRODUCTION SYSTEM',
        headerTitle: 'Converged Media Live Project Management System and SOP Design',
        eyebrow: 'PROJECT MANAGEMENT / OPERATION DESIGN / PROCESS OPTIMIZATION',
        title: 'CONVERGENCE MEDIA LIVE PRODUCTION SYSTEM',
        disciplines: 'Project Management · Operation Design · Process Optimization',
        paragraphs: [
          'This project addresses challenges in large-scale live production management, including unclear role responsibilities, experience-dependent workflows, and inefficient team collaboration. From a project management perspective, I analyzed the full lifecycle of live broadcasting projects and developed a standardized SOP system covering role definitions, task checklists, communication mechanisms, and execution guidelines.',
          'By restructuring workflows and establishing operational standards, the project transformed experience-based execution into a scalable and repeatable management system. Taking the Project Manager role as an example, I designed a complete workflow covering requirement coordination, resource management, on-site execution, and post-project documentation, enabling more efficient collaboration and continuous improvement for future projects.',
        ],
      },
      contentImage: asset('project-live-sop-detail.jpg'),
    },
  },
  {
    id: 'film', label: '中国电影120周年数据新闻与交互可视化设计', image: asset('project-film-cover.png'),
    detail: {
      directPageSwitch: true,
      projectLink: 'https://readymag.website/u672075943/5650021/',
      chinese: {
        headerEyebrow: '中国电影120周年数据新闻与交互可视化设计',
        headerTitle: '120 YEARS OF CHINESE CINEMA',
        eyebrow: '数据叙事 / 数据可视化 / 交互体验',
        title: '中国电影120周年数据新闻与交互可视化设计',
        disciplines: '数字叙事 · 数据可视化 · 交互体验',
        paragraphs: [
          '针对中国电影百年发展历程信息复杂、传统文化内容传播形式相对单一的问题，本项目探索如何通过数据可视化与交互设计重新呈现中国电影文化。以中国电影120周年发展历程为内容基础，我从历史脉络、数据关系与用户阅读体验出发，构建兼具信息逻辑与视觉叙事的数据新闻作品。',
          '通过数据整理、信息架构与视觉设计的结合，项目将复杂的电影发展历程转化为直观、易理解的数字体验。通过现代媒介语言连接历史文化与年轻受众，探索传统文化内容在数字环境中的创新表达方式。',
        ],
      },
      english: {
        headerEyebrow: '120 YEARS OF CHINESE CINEMA',
        headerTitle: 'Chinese Cinema 120th Anniversary Data Journalism and Interactive Visualization Design',
        eyebrow: 'DIGITAL STORYTELLING / DATA VISUALIZATION / INTERACTIVE EXPERIENCE',
        title: '120 YEARS OF CHINESE CINEMA',
        disciplines: 'Digital Storytelling · Data Visualization · Interactive Experience',
        paragraphs: [
          'This project explores how data visualization and interactive storytelling can reinterpret the history of Chinese cinema and make cultural narratives more accessible. Focusing on 120 years of Chinese film development, I structured historical information, data relationships, and user experience to create an interactive data journalism project that combines analytical thinking with visual storytelling.',
          'By integrating data organization, information architecture, and visual design, the project transforms complex cinematic history into an intuitive digital experience. It explores how cultural narratives can be revitalized through contemporary media and connected with younger audiences through new forms of expression.',
        ],
      },
      brochurePages: Array.from({ length: 9 }, (_, index) => ({
        number: String(index + 1).padStart(2, '0'),
        image: asset(`chinese-cinema-page-${index + 1}.png`),
      })),
    },
  },
]

const videoWorks = [
  { image: asset('video-mr-chu.png'), text: '微纪录片-《我是楮先生》', youtubeId: 'EpCQMCmqiXQ', description: '微纪录片《我是楮先生》，探访北京传统手工纸文化空间，记录两位 80 后主理人寻访古纸、复原古法、创新文创的漫长坚守，展现小店传承东方纸文化背后的热忱与付出。' },
  { image: asset('video-anonymous.png'), text: '校园宣传片-《无名之人》', youtubeId: 'yegfJEKJfXY', description: '作品以社科大校园为背景，借《无名的人》的旋律，记录了校园里默默付出的劳动者们。镜头聚焦于后勤、安保等平凡岗位的日常，在除夕团圆的节点，致敬每一位坚守岗位或奔赴归途的“无名者”，用影像为平凡的守护写下温柔注脚。' },
  { image: asset('video-love.png'), text: '影视混剪-《关于爱情》', youtubeId: 'Jn0uZadNQE0', description: '本片为情感主题影视混剪作品《关于爱情》，以爱情完整成长轨迹为核心叙事主线，串联初见悸动、情愫萌芽、热恋奔赴、矛盾误会、温柔挽回、终得圆满六大情感阶段。利用蒙太奇剪辑手法衔接爱情里的甜蜜与酸涩、争执与和解。打破单一影视素材局限，以碎片化镜头拼接构建完整情感叙事，层层递进演绎爱情从懵懂初识到笃定相守的全过程，细腻呈现亲密关系中的百态情绪，赋予影像强烈的情感共鸣与故事质感。' },
  { image: asset('video-yisheng.png'), text: '微纪录片-《才华如何兑换现实》', youtubeId: 'GHRXp_s34T4', description: '本片以“才华如何落地为现实”为核心命题，深度对话亿生艺师艺术学校校长、亿家星艺术团创始人王旭平及教师团队。围绕艺术教育行业的真实生态，从创业初心、教学深耕、行业困境到人才培养，探讨天赋、热爱与市场化生存之间的平衡之道。' },
  { image: asset('video-campus.png'), text: '校园宣传片-《社科大瞭望塔》', youtubeId: '-AsE0sZCRfc', description: '本片以“校园青春”为核心主题，参考《土耳其瞭望塔》标志性的无缝转场与蒙太奇混剪风格，将社科大校园的景观空镜与学生日常进行非线性剪辑。通过匹配转场、节奏剪辑与镜头动势衔接，打破时空线性叙事，构建起兼具节奏感与氛围感的视觉节奏，以影像语言呈现校园的多元面貌与青年群体的鲜活状态。' },
  { image: asset('video-donkey.png'), text: '影视混剪-《驴得水》', youtubeId: 'lSVeUMysVXE', description: '影视混剪作品《驴得水》，选用草东没有派对《顶楼》作为配乐基调。借蒙太奇剪辑重组影片镜头，串联荒诞闹剧、人性抉择与欲望拉扯的剧情片段，贴合歌曲颓丧压抑的曲风。镜头节奏贴合旋律起伏，层层剥开名利裹挟下的人心百态，以音乐与影像相融的形式，诠释故事里讽刺现实与人性沉沦的内核。' },
  { image: asset('video-angry-sea.png'), text: '影视混剪-《涉过愤怒的海》', youtubeId: 'liqoZcCL1aU', description: '萃取影片核心剧情与情绪镜头，以蒙太奇剪辑手法铺展故事脉络。围绕亲情救赎、人性挣扎与复仇执念展开叙事，拼接冲突对峙、情绪爆发、命运纠葛等高光画面，透过镜头重组，剖析角色内心的痛苦与抉择，诠释悲剧背后人性、法理与情感的深刻探讨。' },
  { image: asset('video-basketball.png'), text: '运动宣传片-《篮梦·起航》', youtubeId: 'RnT3YBOhLSM', description: '本片为青春运动主题卡点混剪宣传片《篮梦·起航》，以篮球运动为核心载体，聚焦青少年赛场热血瞬间。作品采用高节奏卡点混剪手法，精准匹配激昂动感的背景音乐，通过快慢镜头结合、多角度赛场抓拍、动态转场衔接等影像手法，串联运球、突破、投篮、协作、拼搏等精彩画面。摒弃冗余叙事，以视觉节奏带动情绪张力，极致诠释少年热血、永不言弃的体育精神与蓬勃向上的青春力量，整体画面氛围感拉满，兼具观赏性与感染力，塑造出肆意热烈、逐梦前行的青春运动风貌。' },
  { image: asset('video-ae.png'), text: 'AE动效宣传片', youtubeId: 'wNLQFOHTSDw', description: '本作品以文字动画、节奏卡点与动态版式设计构成视觉主体，通过利落流畅的转场、字体形变与色彩节奏变化，打造极具冲击力的快闪视觉效果。视频整体风格简洁干练、动感十足，以鲜明的视觉节奏介绍社团特色与定位，传递社团活力氛围，最终发出招新邀请，直观展现融媒体社的青春气场与专业魅力，起到吸睛宣传、吸引新生加入的作用。' },
  { image: asset('video-campus-singing.png'), text: 'Vlog-《校歌赛直播幕后》', youtubeId: 'gUweIuK-_DE', description: '以大赛开播倒计时 36 小时为时间线，完整记录融媒体社直播团队从前期筹备、设备调试、机位布置、流程彩排到现场控场导播的全部幕后工作。镜头跟随团队成员穿梭于舞台与幕后，展现一场完整校园直播背后的统筹协作、技术执行与细节打磨，让观众看见镜头之外，每一场精彩直播的诞生全过程，真实呈现融媒体人专业、高效、默契配合的幕后工作日常。' },
  { image: asset('video-birtv.png'), text: 'Vlog-《BIRTV 展会》', youtubeId: 'zSgWSkFXImo', description: '本片为融媒体社受邀参观 BIRTV2025（第三十二届北京国际广播电影电视展览会）的纪实混剪作品。以“全媒体、超高清、强智能”的展会主题为脉络，通过快节奏蒙太奇，串联超高清设备、AI 制作、虚拟制片等前沿技术展区画面，同步记录社员观展交流、沉浸式体验的鲜活瞬间。' },
]

const videoDescriptionsEnglish = [
  'A mini documentary following two founders born in the 1980s as they preserve traditional Chinese handmade paper, revive old techniques, and develop new cultural products.',
  'Set on the UCASS campus, this film pays tribute to the often-unseen workers who keep campus life running, using music and observational montage to honor everyday guardians.',
  'A cinematic montage tracing love from first encounter and infatuation through conflict, reconciliation, and lasting commitment.',
  'Conversations with the founders and teachers of Yisheng Yishi explore how artistic talent, education, passion, and market realities can become a sustainable practice.',
  'A campus youth film inspired by the seamless transitions of the Turkish Watchtower, combining campus landscapes and student life into a rhythmic visual portrait.',
  'A montage set to the subdued intensity of The Rooftop, revealing absurdity, desire, moral compromise, and the erosion of humanity in Mr. Donkey.',
  'A dramatic montage about family redemption, human struggle, and revenge, examining the pain and choices behind the story through conflict and emotional release.',
  'A high-energy basketball montage built around quick cuts, dynamic transitions, and game-day momentum, celebrating youthful drive and an unyielding sporting spirit.',
  'A kinetic motion-graphics promo built from typography animation, rhythmic cuts, dynamic layouts, and bold color changes to introduce the society and invite new members.',
  'A 36-hour countdown documentary following the livestream team from planning and equipment checks to camera setup, rehearsals, and live directing behind a campus choir competition.',
  'A documentary montage of the media society visiting BIRTV 2025, connecting ultra-HD equipment, AI production, virtual production, and members’ hands-on exhibition experience.',
]

const strengthDetailsEnglish = [
  { keywords: 'Multi-role collaboration | Schedule management | On-site coordination', description: 'Contributed to 10+ campus live broadcasts and recordings, including commercial esports productions. Managed cross-role coordination, schedules, and on-site delivery, with experience across the full project lifecycle.' },
  { keywords: 'SOP building | Process mapping | Standardization | Efficiency', description: 'Mapped the full workflow from preparation and rehearsal to live execution and archiving, creating reusable SOPs for project managers, camera, subtitles, publishing, and other roles.' },
  { keywords: 'Editorial planning | Platform operations | User insight | Content production | Distribution strategy', description: 'Plan and adapt content for different platforms by reading their audiences, ecosystems, and distribution mechanics, while contributing to reporting, interviews, copywriting, and publishing.' },
  { keywords: 'Visual concepts | Brand design | Adobe | AI-assisted design', description: 'Use Adobe Photoshop, Adobe InDesign, Adobe Illustrator, and AI tools such as Midjourney and GPT-Image across posters, key visuals, brochures, banners, and campaign materials, from concept through rollout.' },
  { keywords: 'Video editing | Motion design | Script planning | AI creation', description: 'Use Adobe Premiere, Adobe After Effects, Adobe Audition, Final Cut Pro, and AI tools for editing, audio, motion design, scripting, and visual generation across news videos, features, short films, and integrated-media content.' },
  { keywords: 'Cross-team communication | Collaboration | Event coordination | On-site response', description: 'Apply clear, accurate, and professional communication across society management, event coordination, and project collaboration, supported by a Putonghua Level 2-A certificate.' },
  { keywords: 'CET-4 | CET-6 | IELTS 7.0 | English research | Information reading', description: 'With CET-4, CET-6, and IELTS 7.0, I can read English sources, retrieve information, and translate cross-cultural material into useful research, planning, and content inputs.' },
  { keywords: 'Office | Excel data processing | Pivot tables | Information organization | Reporting', description: 'Use Word, Excel, and PowerPoint for writing, data organization, and presentations, with practical skills in pivot tables, filtering, conditional formatting, VLOOKUP, and multidimensional data synthesis.' },
]

const graphicWorks = [
  { image: asset('graphic-1.png'), title: '视觉海报作品' },
  { image: asset('graphic-2.png'), title: '品牌视觉练习' },
  { image: asset('graphic-3.png'), title: '公益海报：幕后黑手' },
  { image: asset('graphic-4.png'), title: '主题视觉海报' },
  { image: asset('graphic-5.png'), title: '媒体融合十年主视觉' },
  { image: asset('graphic-6.png'), title: '元旦晚会主海报' },
  { image: asset('graphic-7.png'), title: '舞心所向主海报' },
  { image: asset('graphic-8.png'), title: '舞心所向折页节目单' },
  { image: asset('graphic-9.png'), title: '元宵节日贺图' },
  { image: asset('graphic-10.png'), title: '端午节日贺图' },
  { image: asset('graphic-11.png'), title: '视觉记录一' },
  { image: asset('graphic-12.png'), title: '视觉记录二' },
  { image: asset('graphic-13.png'), title: '视觉记录三' },
  { image: asset('graphic-14.png'), title: '视觉记录四' },
  { image: asset('graphic-15.png'), title: '排球协会招新海报' },
  { image: asset('graphic-16.png'), title: '阳和杯赛事海报' },
  { image: asset('graphic-17.png'), title: '融媒体实验室介绍展板' },
  { image: asset('graphic-18.png'), title: 'UCG校园赛主视觉' },
  { image: asset('graphic-19.jpg'), title: '艺术节活动海报' },
  { image: asset('graphic-20.jpg'), title: '元旦节日贺图' },
  { image: asset('graphic-21.jpg'), title: '融媒体社招新海报' },
]

const bookPageSet = (folder, count) => Array.from({ length: count }, (_, index) => ({
    image: asset(`book-pages/${folder}/${index + 1}.jpg`),
  }))

const bookWorks = [
  {
    id: 'zhi-yuan-editorial', image: asset('book-zhi-yuan-brochure.jpg'), text: '知源葡萄酒品牌宣传册',
    detail: { layout: 'book', directPageSwitch: true, bookPages: bookPageSet('new-zhi-yuan', 11), chinese: { title: '知源葡萄酒品牌宣传册', subtitle: 'ZHIYUAN WINE' }, english: { title: 'ZHIYUAN WINE BRAND BROCHURE', subtitle: 'ZHIYUAN WINE' } },
  },
  {
    id: 'great-wall-dunhuang', image: asset('book-great-wall-dunhuang.jpg'), text: '从长城到敦煌：文化遗址的故事',
    detail: { layout: 'book', directPageSwitch: true, bookPages: bookPageSet('new-great-wall', 8), chinese: { title: '从长城到敦煌：文化遗址的故事', subtitle: 'FROM THE GREAT WALL TO DUNHUANG' }, english: { title: 'FROM THE GREAT WALL TO DUNHUANG', subtitle: 'CULTURAL HERITAGE STORIES' } },
  },
  {
    id: 'frame-probe', image: asset('book-frame-probe.jpg'), text: '杂志《帧·探》',
    detail: { layout: 'book', directPageSwitch: true, bookPages: bookPageSet('new-frame-probe', 22), chinese: { title: '杂志《帧·探》', subtitle: 'FRAME PROBE' }, english: { title: 'FRAME PROBE MAGAZINE', subtitle: 'FRAME PROBE' } },
  },
  {
    id: 'new-voice', image: asset('book-new-voice.jpg'), text: '电子报《新声报》',
    detail: { layout: 'book', directPageSwitch: true, bookPages: bookPageSet('new-voice', 12), chinese: { title: '电子报《新声报》', subtitle: 'NEW VOICE' }, english: { title: 'NEW VOICE NEWSLETTER', subtitle: 'NEW VOICE' } },
  },
  {
    id: 'ucass-recruitment', image: asset('book-ucass-recruitment.jpg'), text: '社科大新传学院招新宣传册',
    detail: { layout: 'panorama-book', chinese: { title: '社科大新传学院招新宣传册', subtitle: 'UCASS SCHOOL OF JOURNALISM AND COMMUNICATION' }, english: { title: 'UCASS SCHOOL OF JOURNALISM AND COMMUNICATION', subtitle: 'RECRUITMENT BROCHURE' }, panoramaPages: [asset('ucass-page-1.png'), asset('ucass-page-2.png')] },
  },
]

const internships = [
  {
    id: '01',
    date: '2026.7-至今',
    company: '北京新意互动数字技术有限公司',
    role: '客户执行实习生',
    hoverText: '(CIG)',
    image: asset('flowing-water.png'),
    detail: {
      zh: {
        role: '客户执行实习生',
        sections: [
          ['品牌策略策划', '参与中国联通品牌传播项目，围绕合作伙伴大会、季度新媒体传播等工作，完成传播目标拆解、平台策略、内容规划与资源统筹。'],
          ['内容文案策划', '负责合作伙伴大会宣传工作，撰写高层专访大纲、成果视频脚本，转化品牌技术内容；策划达人传播方案，搭建全域内容传播矩阵与执行体系。'],
          ['视觉物料制作', '负责联通品牌视觉运营，完成多款节气主题海报的创意优化与成品输出，保障品牌视觉统一与节点常态化宣发。'],
        ],
      },
      en: {
        role: 'Account Executive Intern',
        sections: [
          ['Brand Strategy', 'Contributed to China Unicom brand communication projects, translating partner conferences and quarterly social campaigns into communication objectives, platform strategies, content plans, and resource coordination.'],
          ['Content & Copywriting', 'Developed executive interview outlines and achievement-film scripts, translated technical brand content, and planned creator campaigns across an omnichannel content matrix.'],
          ['Visual Production', 'Supported China Unicom visual operations through seasonal poster concept refinement and final artwork delivery, maintaining a consistent and continuous brand presence.'],
        ],
      },
    },
  },
  {
    id: '02',
    date: '2025.9-2026.6',
    company: '北京炬野文化传播发展有限公司',
    role: '视觉设计',
    hoverText: '(Juye)',
    image: asset('flowing-water.png'),
    detail: {
      zh: { role: '视觉设计', sections: [['视觉设计', '承接公司广告、直播等视觉需求，独立完成海报、宣传册、新媒体图文、数字广告、活动文创等平面设计及图片、视频摄制工作，适配线上线下多渠道宣发。']] },
      en: { role: 'Visual Designer', sections: [['Visual Design', 'Handled visual requests for advertising and live productions, independently delivering posters, brochures, social graphics, digital ads, event merchandise, photography, and video for online and offline communication.']] },
    },
  },
  {
    id: '03',
    date: '2025.3-2025.8',
    company: '中国青年网',
    role: '新媒体编辑',
    hoverText: '(Youth)',
    image: asset('flowing-water.png'),
    detail: {
      zh: {
        role: '新媒体编辑',
        sections: [
          ['新媒体运营', '负责小红书内容运营，持续挖掘青年群体热门爆款话题，拆解优质短视频剪辑框架与文案逻辑，提炼可复用创作思路，单个爆款视频点赞量 1.1w+。'],
          ['新闻采编', '跟进两会新媒体专题报道，赴电影首映活动现场完成采访、素材整理、即时撰稿发稿，独立产出时政、文娱类新媒体稿件。'],
        ],
      },
      en: {
        role: 'New Media Editor',
        sections: [
          ['Social Content Operations', 'Managed Xiaohongshu content, identified high-potential topics for young audiences, deconstructed short-video editing and copywriting patterns, and turned them into reusable creative approaches. One breakout video reached 11K+ likes.'],
          ['News Reporting', 'Followed special coverage of the Two Sessions and reported from a film premiere, handling interviews, source organization, rapid writing and publication, and independent news and entertainment pieces.'],
        ],
      },
    },
  },
  {
    id: '04',
    date: '2024.6-2024.9',
    company: '江西臻美文化传媒有限公司',
    role: '新媒体运营',
    hoverText: '(Zhenmei)',
    image: asset('flowing-water.png'),
    detail: {
      zh: {
        role: '新媒体运营',
        sections: [
          ['电商直播统筹', '配合团队完成直播全流程统筹工作，梳理直播脚本、产品排品、场控分工等基础流程，跟进直播设备、物料筹备，保障直播间有序开播。'],
          ['客户社群运营', '维护品牌客户微信社群，日常发布产品资讯、福利活动，及时回复用户咨询，整理社群用户反馈，提升客户留存与互动活跃度。'],
        ],
      },
      en: {
        role: 'New Media Operations',
        sections: [
          ['E-commerce Live Operations', 'Coordinated the full live-commerce workflow, including scripts, product sequencing, control-room roles, equipment, and production supplies to support reliable broadcasts.'],
          ['Community Operations', 'Maintained brand WeChat communities, published product updates and promotions, responded to customer questions, and synthesized feedback to improve retention and engagement.'],
        ],
      },
    },
  },
]

const strengths = ['项目管理', '流程优化', '内容策划', '视觉设计', '视频剪辑', '沟通表达', '英语能力', '办公软件']

const strengthDetails = [
  {
    keywords: '多岗位协作｜进度管理｜现场协调',
    description: '参与 10+ 场校园大型活动直转播与录制，并参与京东MALL高校电竞季等商业级电竞直播赛事制作，负责多岗位协作、进度推进与现场协调；单场直播实现 10W+ 互动、服务3W+ 人次、6.5W+ 点赞，具备从前期筹备到项目交付的全流程管理经验。',
  },
  {
    keywords: 'SOP搭建｜流程梳理｜标准化｜规范制定｜效率优化',
    description: '针对日常事务及直播项目中岗位职责与执行流程不统一的问题，梳理从筹备、彩排、正演到收尾归档的完整流程，建立项目经理、摄像、字幕等各岗位 SOP 及推送排版规范等标准化文件，将个人经验沉淀为可复用、可迭代的执行体系。',
  },
  {
    keywords: '选题策划｜平台运营｜用户洞察｜内容生产｜传播策略',
    description: '参与多平台内容运营，能够根据不同平台的用户特征、内容生态与传播机制调整选题与表达方式，输出差异化内容；同时参与传统媒体及新媒体新闻采编，覆盖选题策划、采访、文案撰写与内容发布等环节。',
  },
  {
    keywords: '关键词：视觉创意｜品牌设计｜Adobe｜AI辅助设计',
    description: '熟练使用 Adobe Photoshop、Adobe InDesign、Illustrator 等设计工具进行视觉设计；能使用 Midjourney、GPT-Image 等 AI 工具辅助创意发散、视觉生成与设计优化；参与过完整品牌及活动项目的视觉设计，覆盖海报、KV、宣传册、Banner 及周边物料等多种传播载体，能够从视觉概念到延展应用完成整套设计。',
  },
  {
    keywords: '关键词：视频剪辑｜动态设计｜脚本策划｜AI创作',
    description: '熟练使用 Adobe Premiere、Adobe After Effects、Adobe Audition、Final Cut Pro 等视频制作工具进行视频剪辑、音频处理与动态设计；能使用 GPT、可灵、即梦、Midjourney 等 AI 工具辅助内容策划、脚本创作与视觉素材生成；参与过新闻短视频、专题视频、短片及融媒体内容制作，并在多个内容平台进行发布与传播。',
  },
  {
    keywords: '跨部门沟通｜团队协作｜活动对接｜现场协调｜信息传达',
    description: '获得普通话二级甲等证书，并在社团管理、活动对接及项目协作中承担多方沟通与协调工作，能够根据不同沟通场景进行清晰、准确且专业的信息传达。',
  },
  {
    keywords: '关键词：CET-4｜CET-6｜IELTS 7.0｜英文检索｜信息阅读',
    description: '取得大学英语四级（CET-4）、六级（CET-6）及雅思 7.0 成绩，具备英文资料阅读、信息检索与跨文化信息理解能力，可将英文信息转化为研究、策划与内容创作中的有效素材。',
  },
  {
    keywords: '关键词：Office｜Excel数据处理｜数据透视表｜信息整理｜汇报呈现',
    description: '熟练使用 Word、Excel、PowerPoint 等 Office 办公软件完成方案撰写、数据整理与汇报呈现；掌握 Excel 数据透视表、筛选排序、条件格式、VLOOKUP 等数据处理与分析功能，能够高效完成多维数据检索、整理与信息提炼。',
  },
]

function TypedTitle({ text }) {
  const [displayedText, setDisplayedText] = useState('')
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mediaQuery.matches)

    if (mediaQuery.matches) {
      setDisplayedText(text)
      return undefined
    }

    let index = 0
    const timer = window.setInterval(() => {
      index += 1
      setDisplayedText(text.slice(0, index))
      if (index >= text.length) window.clearInterval(timer)
    }, 62)

    return () => window.clearInterval(timer)
  }, [text])

  return (
    <>
      <ShinyText
        text={displayedText}
        disabled={reduceMotion || displayedText.length < text.length}
        speed={3.4}
        delay={0.9}
        color="#ffffff"
        shineColor="#b6b6b6"
        spread={112}
        hoverOnly
      />
      <i className="typing-cursor" aria-hidden="true" />
    </>
  )
}

function InternshipDetail({ internship, language, onClose }) {
  const detail = internship.detail?.[language === 'en' ? 'en' : 'zh']
  const company = localize(internship.company, language)
  return (
    <div className="internship-detail-overlay" role="presentation" onClick={onClose}>
      <article className="internship-detail-card" role="dialog" aria-modal="true" aria-label={company} onClick={(event) => event.stopPropagation()}>
        <header className="internship-detail-card-head">
          <span>{internship.id} / {language === 'en' ? 'EXPERIENCE' : '实习经历'}</span>
          <button type="button" onClick={onClose} aria-label={language === 'en' ? 'Close experience' : '关闭经历'}><X size={18} /></button>
        </header>
        <div className="internship-detail-card-body">
          <div className="internship-detail-card-meta">
            <span>{localize(internship.date, language)}</span>
            <span>{language === 'en' ? 'BEIJING' : '北京'}</span>
          </div>
          <p className="internship-detail-card-kicker">{detail?.role ?? internship.role}</p>
          <h2>{company}</h2>
          <div className="internship-detail-sections">
            {detail?.sections?.map(([title, text]) => (
              <section key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </section>
            ))}
          </div>
        </div>
      </article>
    </div>
  )
}

function App() {
  const scrollFrameRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedInternship, setSelectedInternship] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [language, setLanguage] = useState('zh')
  const [activeStrengthIndex, setActiveStrengthIndex] = useState(0)
  const strengthStackRef = useRef(null)
  const videoModalRef = useRef(null)
  const videoClosingRef = useRef(false)
  const t = (value) => localize(value, language)

  useEffect(() => {
    const syncInternshipFromHash = () => {
      const match = window.location.hash.match(/^#experience-(\d{2})$/)
      const internship = match ? internships.find((item) => item.id === match[1]) : null
      setSelectedInternship(internship ?? null)
    }

    syncInternshipFromHash()
    window.addEventListener('hashchange', syncInternshipFromHash)
    window.addEventListener('popstate', syncInternshipFromHash)
    return () => {
      window.removeEventListener('hashchange', syncInternshipFromHash)
      window.removeEventListener('popstate', syncInternshipFromHash)
    }
  }, [])

  const localizedVideoWorks = useMemo(() => videoWorks.map((item, index) => ({
    ...item,
    text: t(item.text),
    description: language === 'en' ? videoDescriptionsEnglish[index] : item.description,
  })), [language])
  const localizedGraphicWorks = useMemo(() => graphicWorks.map((item) => ({ ...item, title: t(item.title) })), [language])
  const localizedBookWorks = useMemo(() => bookWorks.map((item) => ({ ...item, text: t(item.text) })), [language])

  const closeVideo = useCallback(() => {
    if (!selectedVideo || videoClosingRef.current) return
    videoClosingRef.current = true
    const finish = () => {
      videoClosingRef.current = false
      setSelectedVideo(null)
    }
    animateModalToCover(videoModalRef.current, selectedVideo.openingRect, finish)
  }, [selectedVideo])

  useEffect(() => {
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN'
    document.title = language === 'en' ? 'Chu Qing / Portfolio' : '褚清 / Portfolio'
  }, [language])

  useEffect(() => {
    if (!selectedVideo) return undefined
    videoClosingRef.current = false
    let tween
    const frame = requestAnimationFrame(() => {
      tween = animateModalFromCover(videoModalRef.current, selectedVideo.openingRect)
    })
    return () => {
      cancelAnimationFrame(frame)
      tween?.kill()
    }
  }, [selectedVideo])

  useEffect(() => {
    const scroller = scrollFrameRef.current
    if (!scroller || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    let disposed = false
    const ctx = gsap.context(() => {
      const intro = gsap.timeline({ defaults: { ease: 'power3.out' } })
      intro
        .from('.hero-topline, .hero .eyebrow', { autoAlpha: 0, y: 14, duration: .62, stagger: .1 })
        .from('.hero-desc', { autoAlpha: 0, y: 18, duration: .68 }, '-=.32')
        .from('.hero-bottom, .hero-status', { autoAlpha: 0, y: 18, duration: .7, stagger: .12 }, '-=.28')

      const sections = gsap.utils.toArray('.projects, .experience, .works-showcase, .strengths, .contact-section')
      sections.forEach((section) => {
        const heading = section.querySelector('.section-prelude')
        const title = heading?.querySelector('.section-prelude-title')
        const titleLines = title ? gsap.utils.toArray(title.querySelectorAll('.section-prelude-line')) : []
        const titleCode = heading?.querySelector('.section-prelude-code')
        const meta = heading?.querySelector('.section-prelude-meta')
        const body = section.querySelector('.project-list, .flowing-menu-wrap, .works-stack, .strength-layout, .contact-email')
        if (!heading || !titleLines.length) return

        const titleTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            scroller,
            start: 'top 78%',
            toggleActions: 'restart none restart reverse',
          },
        })

        titleTimeline
          .fromTo(titleLines, { autoAlpha: 0, yPercent: 72 }, { autoAlpha: 1, yPercent: 0, duration: .66, stagger: .09, ease: 'power4.out', overwrite: 'auto' })
          .fromTo([titleCode, meta].filter(Boolean), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .5, stagger: .1, ease: 'power3.out', overwrite: 'auto' }, '-=.34')
        if (body) {
          gsap.from(body, {
            autoAlpha: 0,
            y: 18,
            duration: .64,
            ease: 'power3.out',
            scrollTrigger: { trigger: section, scroller, start: 'top 78%', once: true },
          })
        }
      })

      gsap.utils.toArray('.work-stream-head').forEach((head) => {
        const title = head.querySelector('.work-stream-title')
        const note = head.querySelector('p')
        if (!title) return
        gsap.timeline({
          scrollTrigger: { trigger: head, scroller, start: 'top 86%', toggleActions: 'restart none restart reverse' },
        })
          .from(title, { autoAlpha: 0, y: 26, duration: .62, ease: 'power4.out' })
          .from(note, { autoAlpha: 0, x: 14, duration: .42, ease: 'power3.out' }, '-=.28')
      })

      gsap.utils.toArray('.about-heading, .contact-content h3').forEach((title) => {
        gsap.from(title, {
          autoAlpha: 0,
          y: 28,
          duration: .7,
          ease: 'power4.out',
          scrollTrigger: { trigger: title, scroller, start: 'top 82%', toggleActions: 'restart none restart reverse' },
        })
      })

      const refreshAfterFonts = async () => {
        try {
          await document.fonts?.ready
        } catch {
          // Font loading is non-critical; the fallback metrics are still valid.
        }
        if (!disposed) requestAnimationFrame(() => ScrollTrigger.refresh())
      }
      refreshAfterFonts()
    }, scroller)

    return () => {
      disposed = true
      ctx.revert()
    }
  }, [language])

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        if (selectedInternship) window.history.replaceState(null, '', '#experience')
        setSelectedInternship(null)
        if (selectedVideo) closeVideo()
        setMenuOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedInternship, selectedProject, selectedVideo, closeVideo])

  const navItems = useMemo(() => [
    [localize('项目', language), '#projects'],
    [localize('经历', language), '#experience'],
    [localize('作品', language), '#works'],
    [localize('能力', language), '#capabilities'],
  ], [language])

  const closeMenu = () => setMenuOpen(false)

  const selectBook = useCallback((index, sourceElement) => {
    const book = bookWorks[index]
    if (!book) return
    setSelectedProject({ ...book, label: book.text, openingRect: copyRect(sourceElement) })
  }, [])

  const selectInternship = (id) => {
    const internship = internships.find((item) => item.id === id)
    if (!internship) return
    setSelectedInternship(internship)
    window.history.pushState(null, '', `#experience-${id}`)
  }

  const handleSectionLink = (event, href) => {
    event.preventDefault()
    closeMenu()

    const scrollToSection = () => {
      const frame = scrollFrameRef.current
      const target = document.querySelector(href)
      if (!frame || !target) return

      const top = href === '#top' ? 0 : target.offsetTop
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
      frame.scrollTo({ top, behavior })
    }

    if (selectedInternship || selectedProject) {
      setSelectedInternship(null)
      setSelectedProject(null)
      window.history.replaceState(null, '', href)
      window.requestAnimationFrame(() => window.requestAnimationFrame(scrollToSection))
      return
    }

    scrollToSection()
    window.history.replaceState(null, '', href)
  }

  return (
    <div className={`site-shell lang-${language}`} style={{ '--internship-card-bg': `url("${asset('internship-card-bg.png')}")` }}>
      <div className="background-scene" aria-hidden="true">
        <RippleVideo src={asset('hero-fish.mp4')} poster={asset('film-cover.png')} />
        <div className="background-video-tint" />
      </div>
      <header className="site-nav">
        <a className="brand" href="#top" onClick={(event) => handleSectionLink(event, '#top')} aria-label={t('回到首页')}>
          <img className="brand-avatar" src={asset('fish-avatar.jpg')} alt="" />
        </a>
        <nav className="nav-links" aria-label={t('主导航')}>
          {navItems.map(([label, href]) => <a key={href} href={href} onClick={(event) => handleSectionLink(event, href)}>{label}</a>)}
        </nav>
        <div className="nav-actions">
          <div className="language-toggle" role="group" aria-label={t('语言切换')}>
            <button className={language === 'zh' ? 'is-active' : ''} type="button" onClick={() => setLanguage('zh')} aria-pressed={language === 'zh'} aria-label={t('中文')}>中</button>
            <button className={language === 'en' ? 'is-active' : ''} type="button" onClick={() => setLanguage('en')} aria-pressed={language === 'en'} aria-label={t('英文')}>EN</button>
          </div>
          <button className="menu-toggle" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={menuOpen ? t('关闭菜单') : t('打开菜单')}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <div className={`mobile-menu ${menuOpen ? 'is-open' : ''}`} aria-hidden={!menuOpen}>
        <div className="mobile-menu-inner">
          {navItems.map(([label, href]) => <a key={href} href={href} onClick={(event) => handleSectionLink(event, href)}>{label}</a>)}
        </div>
      </div>

      <main ref={scrollFrameRef} className="scroll-frame">
        <section className="hero" id="top">
          <div className="hero-overlay" />
          <div className="hero-grid" />
          <div className="hero-content page-width">
            <div className="hero-topline"><span>CHU QING / PERSONAL PORTFOLIO</span><span>BRAND · OPERATIONS · PRODUCT · RESEARCH</span></div>
            <div className="hero-title-wrap">
              <p className="eyebrow"><span className="status-dot" /> BRAND / OPERATIONS / PRODUCT / RESEARCH</p>
              <h1><span className="hero-title-en" aria-label="Personal Portfolio"><span className="title-reserve" aria-hidden="true">PERSONAL<br />PORTFOLIO.</span><span className="title-live"><TypedTitle text={'PERSONAL\nPORTFOLIO.'} /></span></span><span className="hero-title-cn">{t('褚清 / CHU QING')}</span></h1>
              <p className="hero-desc">{t('品牌传播、策划运营、产品推进与项目研究。')}<span>BRAND → OPERATIONS → PRODUCT → RESEARCH</span></p>
            </div>
            <div className="hero-bottom">
              <div className="hero-actions">
                <a className="button button-yellow" href="#projects" onClick={(event) => handleSectionLink(event, '#projects')}>{language === 'en' ? 'VIEW PROJECTS' : '查看项目'} <ArrowUpRight size={16} /></a>
                <a className="button button-line" href="#experience" onClick={(event) => handleSectionLink(event, '#experience')}>{language === 'en' ? 'VIEW EXPERIENCE' : '查看经历'} <ArrowUpRight size={16} /></a>
              </div>
              <div className="hero-index"><span>SCROLL TO EXPLORE</span><span className="hero-rule" /><span className="hero-code">CQ / 001</span></div>
            </div>
            <div className="hero-status"><span><i /> AVAILABLE FOR</span><strong>BRAND · OPERATIONS · PRODUCT · RESEARCH</strong><span>BASED IN BEIJING / 2026</span></div>
          </div>
        </section>

        <section className="about-section page-width" id="about">
          <div className="about-heading">
            <p className="about-kicker">{t('Creative Strategist · Brand Communication · Visual Storytelling')}</p>
            {language === 'zh' && <p className="about-kicker-cn">{t('创意策略｜品牌传播｜视觉叙事')}</p>}
          </div>
          <div className="about-content">
            <div className="about-copy">
              <div className="about-body">
              <p>{t('我是一名专注于品牌传播与数字内容创新的创意实践者，拥有新闻传播、视觉设计、新媒体运营与品牌服务的复合背景。')}</p>
              <p>{t('我的创作始终围绕“如何让信息被理解、被记住、被传播”展开。从用户洞察、内容策划，到视觉表达与传播执行，我习惯以策略思维拆解问题，并通过创意方式寻找解决方案。')}</p>
              <p>{t('在过去的学习与实践中，我参与过品牌策划、新媒体运营、视觉设计、数字内容制作等项目，逐渐形成了从内容研究到创意落地的完整工作方式。我相信，好的创意不仅需要美感，更需要回应真实需求，连接人与品牌之间的关系。')}</p>
              </div>
            </div>
            <div className="about-visual">
              <TiltedCard
                imageSrc={asset('about-portrait.jpg')}
                altText={t('关于照片')}
                containerHeight="490px"
                containerWidth="100%"
                imageHeight="430px"
                imageWidth="320px"
                rotateAmplitude={10}
                scaleOnHover={1.04}
                showMobileWarning={false}
              />
            </div>
          </div>
        </section>

        <div className="scroll-glass-rail" aria-hidden="true" />

        <section className="projects section page-width" id="projects">
          <SectionPrelude index={1} title="SELECTED" accent="PROJECTS" label={t('精选项目')} summary={t('四个项目，四种推进路径。')} total={4} />
          <div className="project-list">
            <ProjectAccordion
              items={projectGalleryItems.map((item) => ({ ...item, label: t(item.label) }))}
              onSelect={(project, sourceElement) => setSelectedProject({ ...project, openingRect: copyRect(sourceElement) })}
            />
          </div>
        </section>

        <section className="experience section page-width" id="experience">
          <SectionPrelude index={2} title="INTERNSHIP" accent="EXPERIENCE" label={t('实习经历')} summary={t('在真实业务节奏里，逐步扩大负责范围。')} total={5} />
          <FlowingMenu items={internships.map((item) => ({ ...item, text: t(item.company), date: t(item.date) }))} onSelect={selectInternship} />
        </section>

        <section className="works-showcase section page-width" id="works">
          <SectionPrelude index={3} title="WORK" accent="ARCHIVE" label={t('作品选辑')} summary={t('视频、平面与书册的作品归档。')} total={5} />
          <div className="works-stack">
            <section className="work-stream work-stream-video" aria-labelledby="video-works-title">
              <header className="work-stream-head">
                <h3 className="work-stream-title" id="video-works-title"><img className="work-stream-title-quote" src={asset('title-quotes.webp')} alt="" aria-hidden="true" /><span className="work-stream-title-dots" aria-hidden="true" /><span className="work-stream-title-mark">MOVING IMAGE</span></h3>
                <p>{t('11部影像作品')}</p>
              </header>
              <div className="video-gallery-stage">
                <DepthCarousel items={localizedVideoWorks} onSelect={(index, item, sourceElement) => setSelectedVideo({ ...item, openingRect: copyRect(sourceElement) })} />
              </div>
            </section>

            <section className="work-stream work-stream-archive" aria-labelledby="graphic-works-title">
              <header className="work-stream-head">
                <h3 className="work-stream-title" id="graphic-works-title"><img className="work-stream-title-quote" src={asset('title-quotes.webp')} alt="" aria-hidden="true" /><span className="work-stream-title-dots" aria-hidden="true" /><span className="work-stream-title-mark">GRAPHIC WORKS</span></h3>
                <p>{t('图像与版式')}</p>
              </header>
              <DriftWall items={localizedGraphicWorks} columns={4} gap={18} speed={60} radius={18} />
            </section>

            <section className="work-stream work-stream-archive" aria-labelledby="book-works-title">
              <header className="work-stream-head">
                <h3 className="work-stream-title" id="book-works-title"><img className="work-stream-title-quote" src={asset('title-quotes.webp')} alt="" aria-hidden="true" /><span className="work-stream-title-dots" aria-hidden="true" /><span className="work-stream-title-mark">BOOKS &amp; EDITORIAL</span></h3>
                <p>{t('编辑与书册')}</p>
              </header>
              <div className="book-gallery-stage">
                <CircularGallery items={localizedBookWorks} bend={0.9} scrollSpeed={2.2} scrollEase={.06} onSelect={selectBook} ariaLabel="Books and editorial gallery" />
              </div>
            </section>
          </div>
        </section>

        <section className="strengths section page-width" id="capabilities">
          <SectionPrelude index={4} title="CORE" accent="CAPABILITIES" label={t('能力结构')} summary={t('从问题定义到交付，保持完整链路。')} total={5} />
          <div className="strength-layout">
            <div className="strength-sidebar"><LineSidebar items={strengths.map(t)} activeIndex={activeStrengthIndex} onItemClick={(index) => strengthStackRef.current?.scrollToIndex(index)} /></div>
            <div className="strength-empty"><ScrollStack ref={strengthStackRef} onActiveIndexChange={setActiveStrengthIndex}>{strengths.map((strength, index) => { const detail = language === 'en' ? strengthDetailsEnglish[index] : strengthDetails[index]; return <ScrollStackItem key={strength}><h3>{t(strength)}</h3><div className="strength-card-copy"><p className="strength-card-keywords">{detail.keywords.replace(/^关键词：/, '')}</p><p>{detail.description}</p></div></ScrollStackItem> })}</ScrollStack></div>
          </div>
        </section>

        <section className="contact-section" id="contact">
          <div className="contact-grid page-width"><SectionPrelude index={5} title="CONTACT" accent="ME" label={t('联系我')} summary={t('开放新的合作与工作可能')} total={5} /><div className="contact-content"><p className="section-label">{t('开放新的合作与工作可能')}</p><h3>{t('下一段经历，')}<br /><em>{t('也许可以一起创建')}</em></h3><a className="contact-email" href="mailto:qingchu0410@outlook.com">qingchu0410@outlook.com <ArrowUpRight size={22} /></a></div><div className="contact-footer"><span>{t('褚清 / CHU QING')}</span><span>{t('策略 · 产品 · 视觉')}</span><a href="#top" onClick={(event) => handleSectionLink(event, '#top')}>{t('回到顶部')} <ArrowUp size={14} /></a></div></div>
        </section>
      </main>
      {selectedProject && <ProjectDetailModal project={selectedProject} language={language} onClose={() => setSelectedProject(null)} />}
      {selectedInternship && <InternshipDetail internship={selectedInternship} language={language} onClose={() => { setSelectedInternship(null); window.history.replaceState(null, '', '#experience') }} />}
      {selectedVideo && (
        <div className="video-detail-overlay" role="presentation" onClick={closeVideo}>
          <article ref={videoModalRef} className="video-detail-modal" role="dialog" aria-modal="true" aria-label={selectedVideo.text} onClick={(event) => event.stopPropagation()}>
            <header><span>{selectedVideo.text}</span><button type="button" onClick={closeVideo} aria-label={language === 'en' ? 'Close work' : '关闭作品'}><X size={20} /></button></header>
            <div className="video-detail-frame"><img src={selectedVideo.image} alt={selectedVideo.text} /></div>
            <div className="video-detail-copy"><p>{selectedVideo.description}</p></div>
            <div className="video-detail-actions"><a href={`https://youtu.be/${selectedVideo.youtubeId}`} target="_blank" rel="noreferrer">{language === 'en' ? 'Watch on YouTube' : '在 YouTube 上观看'} <ArrowUpRight size={14} /></a></div>
          </article>
        </div>
      )}
    </div>
  )
}

export default App

const rootElement = document.getElementById('root')
const root = import.meta.hot?.data.root ?? createRoot(rootElement)

if (import.meta.hot) import.meta.hot.data.root = root

root.render(<App />)
