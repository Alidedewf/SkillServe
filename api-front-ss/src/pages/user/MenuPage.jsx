import React, { useState, useEffect } from 'react';
import Navbar from '../../components/user/Navbar';
import { fetchMenu } from '../../services/api';
import { FiFileText, FiArrowLeft } from 'react-icons/fi';
import styles from './MenuPage.module.css';

const MenuPage = () => {
  const [data, setData] = useState({ pdf_url: null, categories: [] });
  const [loading, setLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [showPdf, setShowPdf] = useState(false);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const result = await fetchMenu();
        setData(result);
        if (result.categories.length > 0) {
          setActiveCategoryId(result.categories[0].id);
        }
      } catch (err) {
        console.error('Ошибка загрузки меню', err);
      } finally {
        setLoading(false);
      }
    };
    loadMenu();
  }, []);

  const activeCategory = data.categories.find(c => c.id === activeCategoryId);

  if (showPdf && data.pdf_url) {
    return (
      <div className={styles.pdfFullscreenContainer}>
        <div className={styles.pdfViewerHeader}>
          <button className={styles.backBtn} onClick={() => setShowPdf(false)}>
            <FiArrowLeft size={20} />
            <span>Назад</span>
          </button>
          <span className={styles.pdfViewerTitle}>Меню (PDF)</span>
        </div>
        <div className={styles.iframeWrapper}>
          <iframe 
            src={`${data.pdf_url}#toolbar=0&navpanes=0`} 
            className={styles.pdfIframe} 
            title="PDF Menu" 
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Меню</h1>
        <p className={styles.subtitle}>Актуальное меню для вашей должности</p>
      </div>

      <div className={styles.content}>
        {loading ? (
          <p>Загрузка...</p>
        ) : (
          <>
            {/* Если есть PDF, показываем сверху */}
            {data.pdf_url && (
              <div className={styles.pdfSection}>
                <div className={styles.pdfIconContainer}>
                  <FiFileText size={32} />
                </div>
                <div>
                  <h3 style={{margin: '0 0 8px 0', color: '#0f172a'}}>Официальное PDF меню</h3>
                  <p style={{margin: '0 0 16px 0', color: '#64748b', fontSize: 14}}>Скачайте или откройте полную версию меню</p>
                </div>
                <button onClick={() => setShowPdf(true)} className={styles.pdfBtn}>
                  Открыть PDF
                </button>
              </div>
            )}

            {/* Если есть категории, показываем интерактивное меню */}
            {data.categories.length > 0 ? (
              <>
                <div className={styles.categoryTabs}>
                  {data.categories.map(cat => (
                    <button
                      key={cat.id}
                      className={`${styles.tab} ${activeCategoryId === cat.id ? styles.active : ''}`}
                      onClick={() => setActiveCategoryId(cat.id)}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {activeCategory && (
                  <div className={styles.grid}>
                    {activeCategory.items.map(item => (
                      <div key={item.id} className={styles.card}>
                        {item.image_url && (
                          <div className={styles.cardImgWrap}>
                            <img src={item.image_url} alt={item.title} />
                          </div>
                        )}
                        <div className={styles.cardBody}>
                          <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>{item.title}</h3>
                            {item.price && <span className={styles.cardPrice}>{item.price}</span>}
                          </div>
                          {item.description && <p className={styles.cardDesc}>{item.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              !data.pdf_url && (
                <div className={styles.emptyState}>
                  Меню пока не загружено
                </div>
              )
            )}
          </>
        )}
      </div>

      <Navbar />
    </div>
  );
};

export default MenuPage;
