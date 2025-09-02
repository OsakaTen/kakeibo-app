"use strick";

{
  // データ管理
  let records = [];
  let currentFilter = 'all';
  let currentMonth = 'all';

  // DOM要素
  const recordForm = document.getElementById('recordForm');
  const typeSelect = document.getElementById('type');
  const amountInput = document.getElementById('amount');
  const categorySelect = document.getElementById('category');
  const dateInput = document.getElementById('date');
  const descriptionInput = document.getElementById('description');
  const monthFilter = document.getElementById('monthFilter');
  const recordsList = document.getElementById('recordsList');
  const totalIncome = document.getElementById('totalIncome');
  const totalExpense = document.getElementById('totalExpense');
  const balance = document.getElementById('balance');

  // 初期化
  function init() {
    // 今日の日付を設定
    dateInput.value = new Date().toISOString().split('T')[0];

    // 月フィルターの選択肢を生成
    generateMonthOptions();

    // ローカルストレージからデータを読み込み
    loadRecords();

    // 初期表示
    renderRecords();
    updateSummary();
  }

  // 月の選択肢を生成
  function generateMonthOptions() {
    const currentDate = new Date();
    const monthNames = [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'
    ];

    // 過去12ヶ月分の選択肢を作成
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      const option = document.createElement('option');
      option.value = `${year}-${(month + 1).toString().padStart(2, '0')}`;
      option.textContent = `${year}年${monthNames[month]}`;
      monthFilter.appendChild(option);
    }
  }

  // ローカルストレージからデータを読み込み
  function loadRecords() {
    const saved = localStorage.getItem('householdRecords');
    if (saved) {
      records = JSON.parse(saved);
    }
  }

  // ローカルストレージにデータを保存
  function saveRecords() {
    localStorage.setItem('householdRecords', JSON.stringify(records));
  }

  // 記録を追加
  function addRecord(event) {
    event.preventDefault();

    const type = typeSelect.value;
    const amount = parseInt(amountInput.value);
    const category = categorySelect.value;
    const date = dateInput.value;
    const description = descriptionInput.value.trim();

    if (!amount || amount <= 0) {
      alert('正しい金額を入力してください');
      return;
    }

    const record = {
      id: Date.now(),
      type: type,
      amount: amount,
      category: category,
      date: date,
      description: description || category,
      timestamp: new Date().toISOString()
    };

    records.push(record);
    saveRecords();

    // フォームをリセット
    recordForm.reset();
    dateInput.value = new Date().toISOString().split('T')[0];

    // 表示を更新
    renderRecords();
    updateSummary();
  }

  // 記録を削除
  function deleteRecord(id) {
    if (confirm('この記録を削除しますか？')) {
      records = records.filter(record => record.id !== id);
      saveRecords();
      renderRecords();
      updateSummary();
    }
  }

  // 記録をフィルタリング
  function filterRecords() {
    return records.filter(record => {
      // 種類フィルター
      if (currentFilter !== 'all' && record.type !== currentFilter) {
        return false;
      }

      // 月フィルター
      if (currentMonth !== 'all') {
        const recordMonth = record.date.substring(0, 7);
        if (recordMonth !== currentMonth) {
          return false;
        }
      }

      return true;
    });
  }

  // 記録一覧を表示
  function renderRecords() {
    const filteredRecords = filterRecords();

    if (filteredRecords.length === 0) {
      recordsList.innerHTML = `
                    <div class="empty-state">
                        <h3>記録がありません</h3>
                        <p>新しい記録を追加してみましょう</p>
                    </div>
                `;
      return;
    }

    // 日付順にソート（新しい順）
    filteredRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

    recordsList.innerHTML = filteredRecords.map(record => `
                <div class="record-item">
                    <div class="record-type ${record.type}">
                        ${record.type === 'income' ? '↗' : '↘'}
                    </div>
                    <div class="record-details">
                        <div class="record-description">${record.description}</div>
                        <div class="record-meta">
                            ${record.category} • ${formatDate(record.date)}
                        </div>
                    </div>
                    <div class="record-amount ${record.type}">
                        ${record.type === 'income' ? '+' : '-'}¥${record.amount.toLocaleString()}
                    </div>
                    <button class="delete-btn" onclick="deleteRecord(${record.id})">削除</button>
                </div>
            `).join('');
  }

  // 集計を更新
  function updateSummary() {
    // 現在の月の記録を取得
    const currentDate = new Date();
    const currentMonthStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;

    const currentMonthRecords = records.filter(record =>
      record.date.substring(0, 7) === currentMonthStr
    );

    const income = currentMonthRecords
      .filter(record => record.type === 'income')
      .reduce((sum, record) => sum + record.amount, 0);

    const expense = currentMonthRecords
      .filter(record => record.type === 'expense')
      .reduce((sum, record) => sum + record.amount, 0);

    const balanceAmount = income - expense;

    totalIncome.textContent = `¥${income.toLocaleString()}`;
    totalExpense.textContent = `¥${expense.toLocaleString()}`;
    balance.textContent = `¥${balanceAmount.toLocaleString()}`;

    // 収支の色を変更
    balance.style.color = balanceAmount >= 0 ? '#4caf50' : '#ff6b6b';
  }

  // 日付フォーマット
  function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  // イベントリスナー
  recordForm.addEventListener('submit', addRecord);

  // フィルターボタンのイベント
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // アクティブ状態を更新
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');

      // フィルターを更新
      currentFilter = e.target.dataset.filter;
      renderRecords();
    });
  });

  // 月フィルターのイベント
  monthFilter.addEventListener('change', (e) => {
    currentMonth = e.target.value;
    renderRecords();
  });

  // 初期化実行
  init();
}