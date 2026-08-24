const prisma = require('../../prisma');
const { notFound } = require('../../common/utils/errors');

const getTestById = async (testId, restaurantId) => {
  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      course: true,
      questions: {
        include: {
          answers: {
            select: {
              id: true,
              content: true,
              match_target: true,
            },
          },
        },
      },
    },
  });

  if (!test || (restaurantId && test.course.restaurant_id !== restaurantId)) {
    throw notFound('Тест');
  }

  const { course, ...testData } = test;

  // Клиенту НЕ отдаём is_correct и привязку match_target по ответам.
  // Возвращаем тип вопроса; для MATCHING — отдельный перемешанный список
  // правых вариантов (match_targets), чтобы порядок не выдавал соответствие.
  testData.questions = (testData.questions || []).map((q) => {
    const answers = q.answers.map((a) => ({ id: a.id, content: a.content }));
    const base = {
      id: q.id,
      test_id: q.test_id,
      content: q.content,
      image_url: q.image_url,
      type: q.type || 'SINGLE',
      answers,
    };
    if (base.type === 'MATCHING') {
      const targets = [...new Set(q.answers.map((a) => a.match_target).filter(Boolean))];
      for (let i = targets.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [targets[i], targets[j]] = [targets[j], targets[i]];
      }
      base.match_targets = targets;
    }
    return base;
  });

  return testData;
};

const submitTest = async (userId, testId, restaurantId, answers) => {
  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      course: true,
      questions: {
        include: {
          answers: true,
        },
      },
    },
  });

  if (!test || (restaurantId && test.course.restaurant_id !== restaurantId)) {
    throw notFound('Тест');
  }

  let correct_count = 0;
  const questionsResult = test.questions.map((q) => {
    const userAnswer = answers && answers.find((a) => parseInt(a.question_id) === q.id);
    const type = q.type || 'SINGLE';
    let is_correct = false;

    if (type === 'MULTIPLE') {
      // Верно ⇔ множество выбранных == множеству правильных
      const correctIds = q.answers.filter((a) => a.is_correct).map((a) => a.id).sort((x, y) => x - y);
      const selected = ((userAnswer && userAnswer.answer_ids) || []).map(Number).sort((x, y) => x - y);
      is_correct =
        correctIds.length > 0 &&
        correctIds.length === selected.length &&
        correctIds.every((id, i) => id === selected[i]);
    } else if (type === 'MATCHING') {
      // Верно ⇔ для каждого ответа сопоставлен верный target
      const expected = new Map(q.answers.map((a) => [a.id, a.match_target]));
      const matches = (userAnswer && userAnswer.matches) || [];
      is_correct =
        q.answers.length > 0 &&
        matches.length === q.answers.length &&
        matches.every((m) => expected.get(parseInt(m.answer_id)) === m.target);
    } else {
      // SINGLE | TRUE_FALSE | SCENARIO — один правильный ответ (обратная совместимость)
      const correctAnswer = q.answers.find((ans) => ans.is_correct);
      is_correct = !!(userAnswer && parseInt(userAnswer.answer_id) === (correctAnswer ? correctAnswer.id : null));
    }

    if (is_correct) correct_count++;

    return {
      id: q.id,
      content: q.content,
      is_correct: !!is_correct,
    };
  });

  const total_questions = test.questions.length;
  const scorePct = total_questions > 0 ? Math.round((correct_count / total_questions) * 100) : 0;
  const isPassed = scorePct >= 70; // Проходной балл 70%

  await prisma.testAttempt.create({
    data: {
      user_id: userId,
      test_id: testId,
      correct_count: correct_count,
      total_questions: total_questions,
    },
  });

  // Если тест сдан (более 70%), помечаем курс как полностью пройденный (100% прогресс)
  if (isPassed && test.course_id) {
    await prisma.userCourseProgress.upsert({
      where: {
        user_id_course_id: {
          user_id: userId,
          course_id: test.course_id,
        },
      },
      update: {
        progress: 100,
        status: 'COMPLETED',
      },
      create: {
        user_id: userId,
        course_id: test.course_id,
        progress: 100,
        status: 'COMPLETED',
      },
    });
  }

  // Если тест сдан на 100%, выдаем достижение привязанное к курсу (если есть)
  if (correct_count === total_questions && test.course_id) {
    const achievementWhere = { course_id: test.course_id };
    if (restaurantId) achievementWhere.restaurant_id = restaurantId;
    const achievement = await prisma.achievement.findFirst({
      where: achievementWhere,
    });
    if (achievement) {
      await prisma.userAchievement.upsert({
        where: {
          user_id_achievement_id: {
            user_id: userId,
            achievement_id: achievement.id,
          },
        },
        update: {},
        create: {
          user_id: userId,
          achievement_id: achievement.id,
        },
      });
    }
  }

  // Если тест сдан — отправляем уведомление о завершении курса
  if (isPassed && test.course_id) {
    const course = await prisma.course.findUnique({
      where: { id: test.course_id },
      select: { title: true },
    });
    await prisma.notification.create({
      data: {
        user_id: userId,
        restaurant_id: restaurantId || null,
        title: '🎓 Курс завершён!',
        message: `Вы успешно прошли курс «${course?.title || 'Курс'}». Сертификат доступен в вашем профиле.`,
      },
    }).catch(() => {}); // не блокируем основной ответ при ошибке
  }

  return {
    correct_count,
    total_questions,
    ranking: correct_count === total_questions ? 1 : Math.floor(Math.random() * 5) + 2,
    coins: correct_count * 10,
    test: {
      questions: questionsResult,
    },
  };

};

module.exports = {
  getTestById,
  submitTest,
};
