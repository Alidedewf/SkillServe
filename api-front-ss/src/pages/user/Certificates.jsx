import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Certificates.module.css';
import { FiArrowLeft, FiDownload, FiAward } from 'react-icons/fi';
import { fetchArchivedCourses, fetchUserProfile } from '../../services/api';

/* ── Генерация сертификата через Canvas ─────────────────── */
const generateCertificate = (canvas, { userName, courseName, date, restaurantName }) => {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  // Вспомогательные функции для рисования фигур на Canvas
  const drawRoundRect = (x, y, w, h, r, fill, stroke) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  };

  const drawSeal = (cx, cy, r) => {
    ctx.save();
    // Золотой градиент для печати
    const sealGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    sealGrad.addColorStop(0, '#ffe066');
    sealGrad.addColorStop(0.3, '#f1c40f');
    sealGrad.addColorStop(0.7, '#d4af37');
    sealGrad.addColorStop(1, '#9a7b0c');

    // Внешние зубчики розетки
    ctx.beginPath();
    const points = 36;
    for (let i = 0; i < points; i++) {
      const angle = (i * Math.PI * 2) / points;
      const dist = i % 2 === 0 ? r : r - 4;
      const x = cx + Math.cos(angle) * dist;
      const y = cy + Math.sin(angle) * dist;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = sealGrad;
    ctx.fill();

    // Внутренний круг
    ctx.beginPath();
    ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a'; // глубокий темно-синий/серый цвет
    ctx.fill();
    ctx.strokeStyle = sealGrad;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Звезда в центре
    ctx.beginPath();
    const starPoints = 5;
    const innerR = 5;
    const outerR = 12;
    for (let i = 0; i < starPoints * 2; i++) {
      const angle = (i * Math.PI) / starPoints - Math.PI / 2;
      const dist = i % 2 === 0 ? outerR : innerR;
      const x = cx + Math.cos(angle) * dist;
      const y = cy + Math.sin(angle) * dist;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = sealGrad;
    ctx.fill();
    ctx.restore();
  };

  // 1. Глубокий премиальный фон (Радиальный градиент)
  const bg = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, W * 0.7);
  bg.addColorStop(0, '#1e293b'); // slate-800
  bg.addColorStop(1, '#0f172a'); // slate-900
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 2. Двойная скругленная рамка
  // Внешняя золотая рамка
  const frameGrad = ctx.createLinearGradient(0, 0, W, H);
  frameGrad.addColorStop(0, '#ffd700'); // Золото
  frameGrad.addColorStop(0.5, '#d4af37'); // Темное золото
  frameGrad.addColorStop(1, '#f3e5ab'); // Светлое золото
  ctx.strokeStyle = frameGrad;
  ctx.lineWidth = 2.5;
  drawRoundRect(20, 20, W - 40, H - 40, 18, false, true);

  // Внутренняя тонкая полупрозрачная рамка
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  drawRoundRect(26, 26, W - 52, H - 52, 14, false, true);

  // 3. Минималистичные угловые золотые декорации
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
  ctx.lineWidth = 1.5;
  const gap = 34;
  const len = 14;
  // Топ-лево
  ctx.beginPath();
  ctx.moveTo(gap, gap + len); ctx.lineTo(gap, gap); ctx.lineTo(gap + len, gap);
  ctx.stroke();
  // Топ-право
  ctx.beginPath();
  ctx.moveTo(W - gap, gap + len); ctx.lineTo(W - gap, gap); ctx.lineTo(W - gap - len, gap);
  ctx.stroke();
  // Бот-лево
  ctx.beginPath();
  ctx.moveTo(gap, H - gap - len); ctx.lineTo(gap, H - gap); ctx.lineTo(gap + len, H - gap);
  ctx.stroke();
  // Бот-право
  ctx.beginPath();
  ctx.moveTo(W - gap, H - gap - len); ctx.lineTo(W - gap, H - gap); ctx.lineTo(W - gap - len, H - gap);
  ctx.stroke();

  // 4. Название ресторана (Элитная платиновая надпись)
  ctx.fillStyle = '#f8fafc'; // slate-50
  ctx.font = '600 14px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText((restaurantName || 'SKILLSERVE').toUpperCase(), W / 2, 65);

  // Тонкий затухающий разделитель под рестораном
  const sepGrad = ctx.createLinearGradient(W / 2 - 80, 0, W / 2 + 80, 0);
  sepGrad.addColorStop(0, 'rgba(212, 175, 55, 0)');
  sepGrad.addColorStop(0.5, 'rgba(212, 175, 55, 0.5)');
  sepGrad.addColorStop(1, 'rgba(212, 175, 55, 0)');
  ctx.strokeStyle = sepGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 80, 78);
  ctx.lineTo(W / 2 + 80, 78);
  ctx.stroke();

  // 5. «Сертификат об успешном прохождении»
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.font = '500 11px Inter, Arial, sans-serif';
  ctx.fillText('СЕРТИФИКАТ ОБ УСПЕШНОМ ПРОХОЖДЕНИИ', W / 2, 112);

  // 6. Имя сотрудника (Крупно, ярко-белый акцент)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px Inter, Arial, sans-serif';
  ctx.fillText(userName || 'Сотрудник', W / 2, 162);

  // Затухающий разделитель под именем
  const lineGrad = ctx.createLinearGradient(W / 2 - 150, 0, W / 2 + 150, 0);
  lineGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  lineGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
  lineGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 150, 178);
  ctx.lineTo(W / 2 + 150, 178);
  ctx.stroke();

  // 7. «успешно прошёл(а) курс»
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = 'italic 14px Inter, Arial, sans-serif';
  ctx.fillText('успешно прошёл(а) курс', W / 2, 206);

  // 8. Название курса (Приятный небесно-синий цвет + автоперенос строк)
  ctx.fillStyle = '#38bdf8'; // sky-400
  ctx.font = 'bold 18px Inter, Arial, sans-serif';
  const maxWidth = W - 140; // больше отступов
  const words = (courseName || 'Курс').split(' ');
  const lines = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? currentLine + ' ' + word : word;
    const testWidth = ctx.measureText(testLine).width;
    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  const centerY = 242;
  const lineHeight = 24;
  const totalHeight = lines.length * lineHeight;
  const startY = centerY - (totalHeight / 2) + (lineHeight / 2);

  lines.forEach((line, index) => {
    ctx.fillText(line, W / 2, startY + index * lineHeight);
  });

  const lastLineY = startY + (lines.length - 1) * lineHeight;
  const dividerY = lastLineY + 16;

  // Разделитель под названием курса
  const divGrad = ctx.createLinearGradient(W / 2 - 100, 0, W / 2 + 100, 0);
  divGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
  divGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.25)');
  divGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 100, dividerY);
  ctx.lineTo(W / 2 + 100, dividerY);
  ctx.stroke();

  // 9. Дата выдачи
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = '500 11px Inter, Arial, sans-serif';
  ctx.fillText(`ДАТА ВЫДАЧИ: ${date}`, W / 2, H - 40);

  // 10. Премиальная золотая печать верификации (в правом нижнем углу)
  drawSeal(W - 75, H - 75, 25);
};

/* ── Компонент ──────────────────────────────────────────── */
const Certificates = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const canvasRefs = useRef({});

  useEffect(() => {
    const load = async () => {
      try {
        const [archived, prof] = await Promise.all([
          fetchArchivedCourses(),
          fetchUserProfile(),
        ]);
        setCourses(Array.isArray(archived) ? archived : []);
        setProfile(prof);
      } catch (err) {
        console.error('Ошибка загрузки сертификатов:', err);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Рисуем на Canvas после того как он появился в DOM
  useEffect(() => {
    if (!profile || courses.length === 0) return;
    courses.forEach((course) => {
      const canvas = canvasRefs.current[course.id];
      if (!canvas) return;
      const completedAt = course.completedAt
        ? new Date(course.completedAt).toLocaleDateString('ru-RU')
        : new Date().toLocaleDateString('ru-RU');
      generateCertificate(canvas, {
        userName: profile.name,
        courseName: course.title,
        date: completedAt,
        restaurantName: profile?.restaurant?.name || 'SkillServe',
      });
    });
  }, [profile, courses]);

  const handleDownload = (courseId, courseTitle) => {
    const canvas = canvasRefs.current[courseId];
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `Сертификат — ${courseTitle}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          <FiArrowLeft size={24} color="#fff" />
        </button>
        <h3 className={styles.title}>Сертификаты</h3>
      </div>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.messageContainer}>
            <p className={styles.message}>Загрузка...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className={styles.emptyState}>
            <FiAward size={56} color="rgba(255,255,255,0.2)" />
            <p className={styles.message}>Пройдите курсы для получения сертификата</p>
          </div>
        ) : (
          <div className={styles.certList}>
            {courses.map((course) => (
              <div key={course.id} className={styles.certCard}>
                <canvas
                  ref={(el) => { canvasRefs.current[course.id] = el; }}
                  width={560}
                  height={380}
                  className={styles.canvas}
                />
                <div className={styles.certMeta}>
                  <span className={styles.certTitle}>{course.title}</span>
                  <button
                    className={styles.downloadBtn}
                    onClick={() => handleDownload(course.id, course.title)}
                  >
                    <FiDownload size={16} />
                    Скачать
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Certificates;
