// کتاب ایپلیکیشن کا مین کنٹرولر (App.js)
document.addEventListener('DOMContentLoaded', () => {

  // گلوبل ویری ایبلز
  let currentVolume = 1;
  let currentPageNumber = 1;
  const totalVolumes = 14;

  // ایلیمنٹس ریفرنسز
  const volumeFilter = document.getElementById('volumeFilter');
  const indexSearchInput = document.getElementById('indexSearchInput');
  const indexList = document.getElementById('indexList');

  const readerVolumeSelect = document.getElementById('readerVolumeSelect');
  const pageBadge = document.getElementById('pageBadge');
  const totalPagesBadge = document.getElementById('totalPagesBadge');
  const pageContent = document.getElementById('pageContent');

  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  const jumpPageInput = document.getElementById('jumpPageInput');
  const jumpPageBtn = document.getElementById('jumpPageBtn');

  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const searchResultsSection = document.getElementById('searchResultsSection');
  const resultsList = document.getElementById('resultsList');
  const searchResultTitle = document.getElementById('searchResultTitle');
  const searchStats = document.getElementById('searchStats');
  const closeSearchBtn = document.getElementById('closeSearchBtn');

  // ۱. ایپ کی شروعات (Initialization)
  function initApp() {
    populateVolumeDropdowns();
    // تبدیلی: ہارڈ کوڈڈ 'all' کی بجائے ڈراپ ڈاؤن کی موجودہ ویلیو پاس کی ہے
    renderIndexList(volumeFilter.value, ''); 
    loadPage(currentVolume, currentPageNumber);
    setupEventListeners();
  }

  // ۲. جلدوں کے ڈراپ ڈاؤن لسٹس بھرنا
  function populateVolumeDropdowns() {
    for (let i = 1; i <= totalVolumes; i++) {
      const volData = window.bookVolumes[i];
      const title = volData ? volData.title : `جلد ${i}`;
      
      // سائڈبار فلٹر
      const opt1 = document.createElement('option');
      opt1.value = i;
      opt1.textContent = title;
      volumeFilter.appendChild(opt1);

      // ریڈر جلد سلیکٹر
      const opt2 = document.createElement('option');
      opt2.value = i;
      opt2.textContent = title;
      readerVolumeSelect.appendChild(opt2);
    }
  }

  // ۳. انڈیکس / فہرست کو رینڈر کرنا
  function renderIndexList(volFilterValue, searchText) {
    indexList.innerHTML = ''; // لسٹ کو پہلے خالی کریں
    
    // ======== نیا اضافہ شروع ========
    // اگر 'جلد منتخب کریں' (blank) سلیکٹ ہو تو آگے کا کوڈ نہ چلائیں
    if (volFilterValue === 'blank') {
      return; 
    }
    // ======== نیا اضافہ ختم ========

    let filtered = bookIndex;
    if (volFilterValue !== 'all') {
      filtered = filtered.filter(item => item.volume == volFilterValue);
    }

    if (searchText.trim() !== '') {
      const query = searchText.trim().toLowerCase();
      filtered = filtered.filter(item => item.topic.toLowerCase().includes(query));
    }

    if (filtered.length === 0) {
      indexList.innerHTML = '<li style="color:#888; text-align:center;">کوئی عنوان نہیں ملا</li>';
      return;
    }

    filtered.forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="topic-title">${item.topic}</span>
        <span class="index-meta-tag">جلد ${item.volume}، ص ${item.page}</span>
      `;
      li.addEventListener('click', () => {
        loadPage(item.volume, item.page);
        // موبائل پر ہموار تجربے کے لیے اوپر اسکرول
        if (window.innerWidth <= 900) {
          window.scrollTo({ top: 400, behavior: 'smooth' });
        }
      });
      indexList.appendChild(li);
    });
  }

  // ۴. مخصوص جلد اور صفحہ لوڈ کرنا
  function loadPage(volNum, pageNum) {
    const volData = window.bookVolumes[volNum];
    if (!volData || !volData.pages || volData.pages.length === 0) {
      alert(`جلد نمبر ${volNum} کا ڈیٹا ابھی موجود نہیں ہے۔`);
      return;
    }

    const pageObj = volData.pages.find(p => p.pageNumber === pageNum);
    if (!pageObj) {
      alert(`جلد ${volNum} میں صفحہ نمبر ${pageNum} نہیں ملا۔`);
      return;
    }

    currentVolume = volNum;
    currentPageNumber = pageNum;

    // UI اپ ڈیٹ
    readerVolumeSelect.value = currentVolume;
    pageBadge.textContent = `صفحہ ${pageNum}`;
    totalPagesBadge.textContent = `${volData.pages.length} صفحات`;
    pageContent.innerHTML = renderPageContent(pageObj);
    jumpPageInput.value = pageNum;
  }

  // ۴-الف. HTML میں خاص کریکٹرز کو محفوظ بنانا (تاکہ متن ٹوٹے نہیں)
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ۴-ب. متن سے ہیڈنگ مارکرز نکال کر خالص متن دینا (سرچ اور جھلک کے لیے)
  function stripHeadingMarkers(text) {
    return text.replace(/\[\[heading:(.*?)\]\]/g, '$1');
  }

  // ۴-ج. صفحے کا HTML تیار کرنا: اوپر کی مرکزی ہیڈنگ + درمیان میں آنے والی ہیڈنگز
  //      صفحے کے شروع کی ہیڈنگ کے لیے pageObj.heading میں لکھیں۔
  //      متن کے درمیان جہاں ہیڈنگ آنی ہو وہاں لکھیں: [[heading: یہاں عنوان لکھیں]]
  function renderPageContent(pageObj) {
    let html = '';

    // صفحے کے شروع کی مرکزی ہیڈنگ (اگر دی گئی ہو)
    if (pageObj.heading) {
      html += `<div class="page-heading">${escapeHtml(pageObj.heading)}</div>`;
    }

    // متن کو [[heading: ...]] مارکر پر تقسیم کریں
    const parts = pageObj.text.split(/\[\[heading:(.*?)\]\]/g);

    parts.forEach((part, index) => {
      if (index % 2 === 1) {
        // طاق نمبر پر ہمیشہ ہیڈنگ کا متن آئے گا (split کے قاعدے کی رُو سے)
        if (part.trim()) {
          html += `<div class="page-heading page-heading-mid">${escapeHtml(part.trim())}</div>`;
        }
      } else if (part.trim()) {
        // عام پیراگراف متن
        html += `<p class="page-paragraph">${escapeHtml(part).replace(/\n/g, '<br>')}</p>`;
      }
    });

    return html;
  }

  // ۵. گلوبل سرچ فنکشن (تمام ۱۴ جلدوں اور ۱۰ ہزار صفحات میں برق رفتاری سے تلاش)
  function performGlobalSearch() {
    const query = searchInput.value.trim();
    if (!query) {
      alert("براہ کرم تلاش کے لیے کوئی لفظ درج کریں۔");
      return;
    }

    resultsList.innerHTML = '';
    let matchCount = 0;

    // تمام جلدوں کے اندر تلاش کا لوپ
    for (let v = 1; v <= totalVolumes; v++) {
      const volData = window.bookVolumes[v];
      if (!volData || !volData.pages) continue;

      volData.pages.forEach(pg => {
        // سرچ اور جھلک کے لیے ہیڈنگ مارکرز ہٹا کر خالص متن استعمال کریں
        const text = stripHeadingMarkers(pg.text);
        const indexMatch = text.indexOf(query);

        if (indexMatch !== -1) {
          matchCount++;

          // سیاق و سباق (Snippet Preview)
          const start = Math.max(0, indexMatch - 40);
          const end = Math.min(text.length, indexMatch + query.length + 40);
          let snippet = text.substring(start, end);
          
          // ہائی لائٹ کرنا
          const highlightedSnippet = snippet.replace(
            new RegExp(query, 'g'),
            `<span class="highlight">${query}</span>`
          );

          const resultCard = document.createElement('div');
          resultCard.className = 'result-card';
          resultCard.innerHTML = `
            <div class="result-header">${volData.title} — صفحہ نمبر ${pg.pageNumber}</div>
            <div class="result-snippet">... ${highlightedSnippet} ...</div>
          `;

          resultCard.addEventListener('click', () => {
            loadPage(v, pg.pageNumber);
            searchResultsSection.style.display = 'none';
          });

          resultsList.appendChild(resultCard);
        }
      });
    }

    searchStats.textContent = `${matchCount} صفحات پر ملا`;
    searchResultTitle.textContent = `تلاش کے نتائج برائے: "${query}"`;
    searchResultsSection.style.display = 'flex';
    searchResultsSection.scrollIntoView({ behavior: 'smooth' });
  }

  // ۶. تمام ایونٹ لسنرز (Event Listeners)
  function setupEventListeners() {
    // نیویگیشن بٹنز
    prevPageBtn.addEventListener('click', () => {
      const volData = window.bookVolumes[currentVolume];
      const currentIndex = volData.pages.findIndex(p => p.pageNumber === currentPageNumber);
      if (currentIndex > 0) {
        loadPage(currentVolume, volData.pages[currentIndex - 1].pageNumber);
      } else {
        alert("یہ اس جلد کا پہلا صفحہ ہے۔");
      }
    });

    nextPageBtn.addEventListener('click', () => {
      const volData = window.bookVolumes[currentVolume];
      const currentIndex = volData.pages.findIndex(p => p.pageNumber === currentPageNumber);
      if (currentIndex < volData.pages.length - 1) {
        loadPage(currentVolume, volData.pages[currentIndex + 1].pageNumber);
      } else {
        alert("اس جلد کے صفحات یہاں مکمل ہو گئے ہیں۔ اگلی جلد کھولنے کے لیے اوپر سے جلد تبدیل کریں۔");
      }
    });

    // ڈائریکٹ پیج جمپ
    jumpPageBtn.addEventListener('click', () => {
      const target = parseInt(jumpPageInput.value);
      if (target) loadPage(currentVolume, target);
    });

    // جلد تبدیل کرنا (ریڈر میں)
    readerVolumeSelect.addEventListener('change', (e) => {
      loadPage(parseInt(e.target.value), 1);
    });

    // انڈیکس فلٹر
    volumeFilter.addEventListener('change', (e) => {
      renderIndexList(e.target.value, indexSearchInput.value);
    });

    indexSearchInput.addEventListener('input', (e) => {
      renderIndexList(volumeFilter.value, e.target.value);
    });

    // گلوبل سرچ ایونٹس
    searchBtn.addEventListener('click', performGlobalSearch);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') performGlobalSearch();
    });

    closeSearchBtn.addEventListener('click', () => {
      searchResultsSection.style.display = 'none';
    });
  }

  // ایپ رن کریں
  initApp();
});