// ================= 配置区域 =================
// ⚠️ 必须修改这里！填入你的 Supabase 信息
const SUPABASE_URL = 'https://oolqaprvhxkplywexuwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_dISN4q5YmuuWyapmlrI2FA_IOMZWgst';
// ===========================================

// 初始化 Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 全局状态
let allProducts = [];

// 启动应用
document.addEventListener('DOMContentLoaded', async () => {
    checkConnection();
    await loadData(); // 加载数据
});

// 1. 检查连接
async function checkConnection() {
    const statusDiv = document.getElementById('connection-status');
    try {
        const { error } = await supabase.from('products').select('count', { count: 'exact', head: true });
        if (error) throw error;
        statusDiv.innerText = '云端已连接';
        statusDiv.className = 'text-xs bg-green-600 px-2 py-1 rounded';
    } catch (e) {
        statusDiv.innerText = '连接失败';
        statusDiv.className = 'text-xs bg-red-600 px-2 py-1 rounded';
        alert('无法连接数据库，请检查 app.js 中的 URL 和 Key 是否正确，以及是否执行了 SQL 建表语句。');
    }
}

// 2. 加载数据并渲染
async function loadData() {
    const { data, error } = await supabase.from('products').select('*').order('id', { ascending: false });

    if (error) {
        console.error('读取失败:', error);
        return;
    }

    allProducts = data || [];
    renderDashboard();
    renderProductList();
    renderInventoryList();
    renderSelectOptions();
    renderAlerts();
}

// --- 页面切换逻辑 ---
function switchTab(tabName) {
    // 隐藏所有页面
    ['dashboard', 'products', 'inventory', 'inbound', 'outbound', 'alerts'].forEach(id => {
        document.getElementById(`page-${id}`).classList.add('hidden');
    });
    // 显示目标页面
    document.getElementById(`page-${tabName}`).classList.remove('hidden');

    // 更新底部导航颜色
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('text-blue-600');
        btn.classList.add('text-gray-400');
    });
    // 简单的逻辑匹配高亮（实际项目中可以用更严谨的方式）
    const activeBtn = document.querySelector(`button[onclick="switchTab('${tabName}')"]`);
    if(activeBtn && activeBtn.classList.contains('nav-btn')) {
        activeBtn.classList.remove('text-gray-400');
        activeBtn.classList.add('text-blue-600');
    }
}

// --- 业务功能实现 ---

// A. 仪表盘统计
function renderDashboard() {
    const totalStock = allProducts.reduce((sum, item) => sum + (item.stock || 0), 0);
    const lowStockCount = allProducts.filter(item => item.stock < 10).length; // 假设小于10为预警

    document.getElementById('dash-total-stock').innerText = totalStock;
    document.getElementById('dash-low-stock').innerText = lowStockCount;
}

// B. 产品管理 (新增)
async function addProduct() {
    const nameInput = document.getElementById('new-prod-name');
    const name = nameInput.value.trim();
    if (!name) return alert('请输入名称');

    const { error } = await supabase.from('products').insert([{
        name: name,
        sku: 'SKU-' + Date.now(), // 自动生成简易SKU
        stock: 0,
        price: 0
    }]);

    if (error) {
        alert('添加失败: ' + error.message);
    } else {
        nameInput.value = '';
        loadData(); // 刷新列表
        alert('添加成功');
    }
}

// C. 渲染列表 (用于产品管理和库存)
function renderProductList() {
    const list = document.getElementById('product-list');
    list.innerHTML = allProducts.map(p => `
        <li class="bg-white p-3 rounded shadow-sm flex justify-between items-center">
            <div>
                <div class="font-bold">${p.name}</div>
                <div class="text-xs text-gray-500">${p.sku}</div>
            </div>
            <button onclick="deleteProduct(${p.id})" class="text-red-500 text-sm">删除</button>
        </li>
    `).join('');
}

function renderInventoryList() {
    const list = document.getElementById('inventory-list');
    list.innerHTML = allProducts.map(p => `
        <li class="p-4 flex justify-between items-center">
            <div>
                <div class="font-bold text-lg">${p.name}</div>
                <div class="text-xs text-gray-500">SKU: ${p.sku}</div>
            </div>
            <div class="text-right">
                <div class="text-xl font-bold ${p.stock < 10 ? 'text-red-600' : 'text-blue-600'}">${p.stock}</div>
                <div class="text-xs text-gray-400">当前库存</div>
            </div>
        </li>
    `).join('');
}

// D. 下拉框选项填充 (用于入库/出库)
function renderSelectOptions() {
    const options = allProducts.map(p => `<option value="${p.id}">${p.name} (余: ${p.stock})</option>`).join('');
    document.getElementById('inbound-select').innerHTML = options;
    document.getElementById('outbound-select').innerHTML = options;
}

// E. 入库操作
async function handleInbound() {
    const id = document.getElementById('inbound-select').value;
    const qty = parseInt(document.getElementById('inbound-qty').value);

    if (!id || !qty || qty <= 0) return alert('请选择商品并输入有效数量');

    const product = allProducts.find(p => p.id == id);
    const newStock = product.stock + qty;

    const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', id);

    if (error) alert('入库失败');
    else {
        alert(`成功入库 ${qty} 件 ${product.name


