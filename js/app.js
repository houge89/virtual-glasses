// 首页应用逻辑
(function() {
    const grid = document.getElementById('glassesGrid');
    const filterBtns = document.querySelectorAll('.filter-btn');
    let currentFilter = 'all';

    // 渲染眼镜卡片
    function renderGlasses(filter) {
        const filtered = filter === 'all'
            ? glassesData
            : glassesData.filter(g => g.category === filter);

        grid.innerHTML = filtered.map(g => `
            <div class="glasses-card" data-id="${g.id}">
                <div class="glasses-card-img">
                    ${g.svg}
                </div>
                <div class="glasses-card-body">
                    <span class="category">${categoryNames[g.category] || g.category}</span>
                    <h3>${g.name}</h3>
                    <div class="price">${g.price}</div>
                    <div class="actions">
                        <a href="tryon.html?glasses=${g.id}" class="btn btn-primary btn-sm">📸 试戴</a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 筛选按钮点击
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderGlasses(currentFilter);
        });
    });

    // 初始化
    renderGlasses('all');
})();
