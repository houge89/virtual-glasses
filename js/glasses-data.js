// 眼镜数据 - 包含 SVG 内联渲染
const glassesData = [
    {
        id: 1,
        name: '经典黑框',
        category: 'classic',
        price: '¥299',
        description: '经典百搭的黑色板材框，适合各种脸型',
        svg: `<svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="15" width="75" height="45" rx="10" stroke="#1a1a1a" stroke-width="4" fill="none"/>
            <rect x="115" y="15" width="75" height="45" rx="10" stroke="#1a1a1a" stroke-width="4" fill="none"/>
            <path d="M85 37 L115 37" stroke="#1a1a1a" stroke-width="4"/>
            <path d="M85 35 L95 30 L95 44 Z" fill="#1a1a1a" opacity="0.3"/>
            <path d="M105 30 L105 44 L115 35 Z" fill="#1a1a1a" opacity="0.3"/>
            <line x1="10" y1="22" x2="2" y2="18" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>
            <line x1="75" y1="22" x2="82" y2="18" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>
            <line x1="125" y1="22" x2="118" y2="18" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>
            <line x1="190" y1="22" x2="198" y2="18" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>
        </svg>`
    },
    {
        id: 2,
        name: '金属圆框',
        category: 'classic',
        price: '¥359',
        description: '精致金属圆框，复古与时尚的完美结合',
        svg: `<svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="47" cy="37" r="30" stroke="#b8860b" stroke-width="3" fill="none"/>
            <circle cx="153" cy="37" r="30" stroke="#b8860b" stroke-width="3" fill="none"/>
            <path d="M77 37 L123 37" stroke="#b8860b" stroke-width="2.5"/>
            <path d="M77 35 L87 30 L87 44 Z" fill="#b8860b" opacity="0.25"/>
            <path d="M113 30 L113 44 L123 35 Z" fill="#b8860b" opacity="0.25"/>
            <line x1="17" y1="25" x2="8" y2="18" stroke="#b8860b" stroke-width="2" stroke-linecap="round"/>
            <line x1="77" y1="25" x2="85" y2="18" stroke="#b8860b" stroke-width="2" stroke-linecap="round"/>
            <line x1="123" y1="25" x2="115" y2="18" stroke="#b8860b" stroke-width="2" stroke-linecap="round"/>
            <line x1="183" y1="25" x2="192" y2="18" stroke="#b8860b" stroke-width="2" stroke-linecap="round"/>
        </svg>`
    },
    {
        id: 3,
        name: '运动款流线',
        category: 'sport',
        price: '¥429',
        description: '运动风格，轻盈流线型设计，适合户外活动',
        svg: `<svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 30 Q40 20 85 30 Q85 65 5 50 Z" fill="#2563eb" opacity="0.15" stroke="#2563eb" stroke-width="3.5"/>
            <path d="M115 30 Q160 20 195 30 Q195 65 115 50 Z" fill="#2563eb" opacity="0.15" stroke="#2563eb" stroke-width="3.5"/>
            <path d="M85 35 L115 35" stroke="#2563eb" stroke-width="3"/>
            <line x1="5" y1="32" x2="0" y2="20" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>
            <line x1="195" y1="32" x2="200" y2="20" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>
        </svg>`
    },
    {
        id: 4,
        name: '复古圆框',
        category: 'retro',
        price: '¥389',
        description: '经典复古圆形眼镜，提升文艺气质',
        svg: `<svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="47" cy="38" r="28" stroke="#8b4513" stroke-width="4" fill="#f5deb3" opacity="0.3"/>
            <circle cx="153" cy="38" r="28" stroke="#8b4513" stroke-width="4" fill="#f5deb3" opacity="0.3"/>
            <path d="M75 38 L125 38" stroke="#8b4513" stroke-width="3"/>
            <line x1="19" y1="25" x2="8" y2="15" stroke="#8b4513" stroke-width="3" stroke-linecap="round"/>
            <line x1="75" y1="25" x2="85" y2="15" stroke="#8b4513" stroke-width="3" stroke-linecap="round"/>
            <line x1="125" y1="25" x2="115" y2="15" stroke="#8b4513" stroke-width="3" stroke-linecap="round"/>
            <line x1="181" y1="25" x2="192" y2="15" stroke="#8b4513" stroke-width="3" stroke-linecap="round"/>
        </svg>`
    },
    {
        id: 5,
        name: '猫眼时尚款',
        category: 'cat',
        price: '¥459',
        description: '优雅猫眼造型，时尚女性的首选',
        svg: `<svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 45 Q5 20 35 18 L75 30 Q80 38 75 50 Q55 55 35 52 Z" fill="#db2777" opacity="0.12" stroke="#db2777" stroke-width="3.5"/>
            <path d="M195 45 Q195 20 165 18 L125 30 Q120 38 125 50 Q145 55 165 52 Z" fill="#db2777" opacity="0.12" stroke="#db2777" stroke-width="3.5"/>
            <path d="M75 38 L125 38" stroke="#db2777" stroke-width="3"/>
            <line x1="5" y1="30" x2="0" y2="18" stroke="#db2777" stroke-width="3" stroke-linecap="round"/>
            <line x1="75" y1="30" x2="80" y2="18" stroke="#db2777" stroke-width="3" stroke-linecap="round"/>
            <line x1="125" y1="30" x2="120" y2="18" stroke="#db2777" stroke-width="3" stroke-linecap="round"/>
            <line x1="195" y1="30" x2="200" y2="18" stroke="#db2777" stroke-width="3" stroke-linecap="round"/>
        </svg>`
    },
    {
        id: 6,
        name: '透明轻量框',
        category: 'classic',
        price: '¥329',
        description: '透明 TR90 材质，超轻设计，几乎无感佩戴',
        svg: `<svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="18" width="75" height="42" rx="12" stroke="#94a3b8" stroke-width="3" fill="#e2e8f0" opacity="0.4"/>
            <rect x="115" y="18" width="75" height="42" rx="12" stroke="#94a3b8" stroke-width="3" fill="#e2e8f0" opacity="0.4"/>
            <path d="M85 38 L115 38" stroke="#94a3b8" stroke-width="3"/>
            <line x1="10" y1="25" x2="2" y2="20" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="75" y1="25" x2="82" y2="20" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="125" y1="25" x2="118" y2="20" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="190" y1="25" x2="198" y2="20" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
        </svg>`
    },
    {
        id: 7,
        name: '飞行员款',
        category: 'sport',
        price: '¥499',
        description: '经典飞行员墨镜造型，遮阳又时尚',
        svg: `<svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 22 Q45 12 82 25 Q82 50 60 55 Q30 55 8 45 Z" stroke="#1a1a1a" stroke-width="3.5" fill="#1a1a1a" opacity="0.25"/>
            <path d="M118 22 Q155 12 192 25 Q192 50 170 55 Q140 55 118 45 Z" stroke="#1a1a1a" stroke-width="3.5" fill="#1a1a1a" opacity="0.25"/>
            <path d="M82 35 L118 35" stroke="#1a1a1a" stroke-width="3"/>
            <line x1="8" y1="25" x2="0" y2="18" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>
            <line x1="192" y1="25" x2="200" y2="18" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>
        </svg>`
    },
    {
        id: 8,
        name: '复古玳瑁纹',
        category: 'retro',
        price: '¥419',
        description: '玳瑁纹理方框，复古绅士的不二之选',
        svg: `<svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="15" width="75" height="48" rx="8" stroke="#8B5E3C" stroke-width="4" fill="#D4A574" opacity="0.35"/>
            <rect x="115" y="15" width="75" height="48" rx="8" stroke="#8B5E3C" stroke-width="4" fill="#D4A574" opacity="0.35"/>
            <path d="M85 38 L115 38" stroke="#8B5E3C" stroke-width="3.5"/>
            <line x1="10" y1="22" x2="2" y2="16" stroke="#8B5E3C" stroke-width="3" stroke-linecap="round"/>
            <line x1="75" y1="22" x2="82" y2="16" stroke="#8B5E3C" stroke-width="3" stroke-linecap="round"/>
            <line x1="125" y1="22" x2="118" y2="16" stroke="#8B5E3C" stroke-width="3" stroke-linecap="round"/>
            <line x1="190" y1="22" x2="198" y2="16" stroke="#8B5E3C" stroke-width="3" stroke-linecap="round"/>
        </svg>`
    },
    {
        id: 9,
        name: '猫眼金边',
        category: 'cat',
        price: '¥529',
        description: '金色猫眼边框，轻奢时尚单品',
        svg: `<svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 42 Q5 22 32 18 L78 28 Q82 38 78 48 Q58 52 35 49 Z" stroke="#d4a017" stroke-width="3" fill="none"/>
            <path d="M195 42 Q195 22 168 18 L122 28 Q118 38 122 48 Q142 52 165 49 Z" stroke="#d4a017" stroke-width="3" fill="none"/>
            <path d="M78 37 L122 37" stroke="#d4a017" stroke-width="2.5"/>
            <line x1="5" y1="28" x2="0" y2="18" stroke="#d4a017" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="78" y1="28" x2="83" y2="18" stroke="#d4a017" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="122" y1="28" x2="117" y2="18" stroke="#d4a017" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="195" y1="28" x2="200" y2="18" stroke="#d4a017" stroke-width="2.5" stroke-linecap="round"/>
        </svg>`
    }
];

// 分类名称映射
const categoryNames = {
    all: '全部',
    classic: '经典款',
    sport: '运动款',
    retro: '复古款',
    cat: '猫眼款'
};
