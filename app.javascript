// ==========================================
// 1. 配置 Supabase (必须修改这里！)
// ==========================================
const SUPABASE_URL = 'https://oolqaprvhxkplywexuwg.supabase.co'; // <--- 填你的 URL
const SUPABASE_KEY = 'sb_publishable_dISN4q5YmuuWyapmlrI2FA_IOMZWgst';                 // <--- 填你的 Key

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 获取页面元素
const statusDiv = document.getElementById('status');
const inputSku = document.getElementById('input-sku'); // 假设你在HTML加了个输入框
const btnSearch = document.getElementById('btn-search');
const btnIn = document.getElementById('btn-in');
const btnOut = document.getElementById('btn-out');
const resultArea = document.getElementById('result-area'); // 显示结果的区域

// ==========================================
// 2. 初始化检查
// ==========================================
async function init() {
    try {
        const { data, error } = await supabase.from('products').select('count', { count: 'exact', head: true });
        if (error) throw error;
        statusDiv.innerText = "✅ 系统就绪 | 云端连接正常";
        statusDiv.style.background = "#d4edda";
        statusDiv.style.color = "#155724";
    } catch (err) {
        statusDiv.innerText = "❌ 连接失败: " + err.message;
        statusDiv.style.background = "#f8d7da";
    }
}
init();

// ==========================================
// 3. 核心业务功能
// ==========================================

// 查询商品
async function searchProduct() {
    const sku = inputSku.value.trim();
    if (!sku) return alert("请输入 SKU 或扫描条码");

    statusDiv.innerText = "正在查询...";

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('sku', sku)
        .single();

    if (error && error.code !== 'PGRST116') {
        // PGRST116 表示没找到数据，不算报错
        statusDiv.innerText = "查询出错";
        return;
    }

    if (data) {
        showResult(`找到商品：<b>${data.name}</b><br>当前位置：${data.location}<br>当前库存：${data.stock}`);
        // 保存当前操作的商品信息到全局变量，方便后续出入库
        window.currentProduct = data;
    } else {
        showResult(`未找到 SKU 为 ${sku} 的商品。<br><button onclick="createNewProduct('${sku}')">新建该商品</button>`);
        window.currentProduct = null;
    }
}

// 新建商品（如果库里没有）
window.createNewProduct = async function(sku) {
    const name = prompt("请输入商品名称：");
    if (!name) return;
    const location = prompt("请输入存放位置（如 A-01-02）：") || "待定";

    const { error } = await supabase.from('products').insert([{ name, sku, stock: 0, location }]);
    if (error) return alert("创建失败：" + error.message);

    alert("创建成功！");
    searchProduct(); // 重新查询刷新
}

// 入库操作
async function stockIn() {
    if (!window.currentProduct) return alert("请先查询商品");
    const qty = parseInt(prompt("请输入入库数量："));
    if (!qty) return;

    const newStock = window.currentProduct.stock + qty;
    const { error } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', window.currentProduct.id);

    if (error) return alert("入库失败：" + error.message);

    alert(`入库成功！当前库存更新为：${newStock}`);
    searchProduct(); // 刷新界面
}

// 出库操作
async function stockOut() {
    if (!window.currentProduct) return alert("请先查询商品");
    const qty = parseInt(prompt("请输入出库数量："));
    if (!qty) return;

    if (window.currentProduct.stock < qty) return alert("库存不足！");

    const newStock = window.currentProduct.stock - qty;
    const { error } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', window.currentProduct.id);

    if (error) return alert("出库失败：" + error.message);

    alert(`出库成功！当前库存更新为：${newStock}`);
    searchProduct(); // 刷新界面
}

// 辅助函数：显示结果
function showResult(html) {
    resultArea.innerHTML = html;
    resultArea.style.display = 'block';
}

// 绑定按钮事件 (假设你在 HTML 里有这些 ID 的按钮)
// 如果你的 HTML 里没有输入框和按钮，请参考第三步修改 HTML
if(btnSearch) btnSearch.onclick = searchProduct;
if(btnIn) btnIn.onclick = stockIn;
if(btnOut) btnOut.onclick = stockOut;


