

/* ================================================================
    入口配置区
    ----------------------------------------------------------------
    以后要加新的二级目录，只需往 SITES 数组里追加一项，刷新页面即可，
    不用改 HTML 结构、不用额外 JS 文件。

    每一项的字段：
        title  卡片标题
        desc   副标题（建议带上目录名，方便辨认）
        href   跳转地址：
                './it-tools/'      同站点的二级目录，推荐写法
                '/xxx/'            站点根路径
                'https://a.com'    外部链接，会自动新标签页打开
        icon   可选，内置图标：'tools' | 'image' | 'globe' | 'crosshair'（不写默认 globe）
    ================================================================ */
const SITES = [
    {
    title: '开发者工具',
    desc: 'it-tools · 开发者在线工具箱',
    href: './it-tools/',
    icon: 'tools',
    },
    {
    title: '漫画滤镜',
    desc: 'animefilter · 图片一键转漫画',
    href: './animefilter/',
    icon: 'image',
    },
    {
    title: 'saltline',
    desc: '@Flelix Rieseberg',
    href: './saltline.html',
    icon: 'crosshair',
    },
];

/* 内置图标（纯内联 SVG，不请求任何外部资源） */
const ICONS = {
    tools:
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>' +
    '</svg>',
    image:
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>' +
    '<circle cx="8.5" cy="8.5" r="1.5"/>' +
    '<polyline points="21 15 16 10 5 21"/>' +
    '</svg>',
    globe:
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="10"/>' +
    '<line x1="2" y1="12" x2="22" y2="12"/>' +
    '<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>' +
    '</svg>',
    /* 射击游戏：瞄准镜十字准星 */
    crosshair:
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="7.5"/>' +
    '<circle cx="12" cy="12" r="2"/>' +
    '<line x1="12" y1="1.5" x2="12" y2="5.5"/>' +
    '<line x1="12" y1="18.5" x2="12" y2="22.5"/>' +
    '<line x1="1.5" y1="12" x2="5.5" y2="12"/>' +
    '<line x1="18.5" y1="12" x2="22.5" y2="12"/>' +
    '</svg>',
};
