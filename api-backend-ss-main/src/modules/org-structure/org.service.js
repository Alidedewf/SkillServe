const prisma = require('../../prisma');
const { notFound, conflict, badRequest } = require('../../common/utils/errors');

const getDepartments = async (restaurantId) => {
  if (!restaurantId) throw badRequest('Не указан ресторан');
  const where = { restaurant_id: restaurantId };

  return prisma.department.findMany({
    where,
    include: { 
      positions: { 
        orderBy: { order: 'asc' },
        include: {
          _count: {
            select: { users: true }
          }
        }
      } 
    },
    orderBy: { order: 'asc' },
  });
};

const createDepartment = async (restaurantId, { name, order = 0 }) => {
  if (!restaurantId) {
    const { badRequest } = require('../../common/utils/errors');
    throw badRequest('Не указан ресторан');
  }

  const existing = await prisma.department.findUnique({
    where: {
      restaurant_id_name: {
        restaurant_id: restaurantId,
        name,
      },
    },
  });
  if (existing) throw conflict('Отдел с таким названием уже существует');

  return prisma.department.create({
    data: {
      restaurant_id: restaurantId,
      name,
      order,
    },
  });
};

const updateDepartment = async (restaurantId, id, { name, order }) => {
  if (!restaurantId) throw badRequest('Не указан ресторан');
  const deptWhere = { id, restaurant_id: restaurantId };

  const dept = await prisma.department.findFirst({
    where: deptWhere,
  });
  if (!dept) throw notFound('Отдел');

  if (name && name !== dept.name) {
    const existing = await prisma.department.findUnique({
      where: {
        restaurant_id_name: {
          restaurant_id: restaurantId,
          name,
        },
      },
    });
    if (existing) throw conflict('Отдел с таким названием уже существует');
  }

  return prisma.department.update({
    where: { id },
    data: {
      name: name !== undefined ? name : dept.name,
      order: order !== undefined ? order : dept.order,
    },
  });
};

const deleteDepartment = async (restaurantId, id) => {
  if (!restaurantId) throw badRequest('Не указан ресторан');
  const deptWhere = { id, restaurant_id: restaurantId };

  const dept = await prisma.department.findFirst({
    where: deptWhere,
  });
  if (!dept) throw notFound('Отдел');

  await prisma.department.delete({ where: { id } });
  return { message: 'Отдел успешно удален' };
};

const getPositions = async (restaurantId, departmentId) => {
  if (!restaurantId) throw badRequest('Не указан ресторан');
  const where = { restaurant_id: restaurantId };

  if (departmentId !== undefined) {
    where.department_id = departmentId ? parseInt(departmentId) : null;
  }
  return prisma.position.findMany({
    where,
    include: { department: true },
    orderBy: { order: 'asc' },
  });
};

const createPosition = async (restaurantId, { department_id, name, order = 0 }) => {
  if (!restaurantId) {
    const { badRequest } = require('../../common/utils/errors');
    throw badRequest('Не указан ресторан');
  }

  if (department_id) {
    const deptWhere = { id: department_id, restaurant_id: restaurantId };

    const dept = await prisma.department.findFirst({
      where: deptWhere,
    });
    if (!dept) throw notFound('Указанный отдел');
  }

  const existing = await prisma.position.findUnique({
    where: {
      restaurant_id_name: {
        restaurant_id: restaurantId,
        name,
      },
    },
  });
  if (existing) throw conflict('Должность с таким названием уже существует');

  return prisma.position.create({
    data: {
      restaurant_id: restaurantId,
      department_id: department_id || null,
      name,
      order,
    },
  });
};

const updatePosition = async (restaurantId, id, { department_id, name, order }) => {
  if (!restaurantId) throw badRequest('Не указан ресторан');
  const posWhere = { id, restaurant_id: restaurantId };

  const pos = await prisma.position.findFirst({
    where: posWhere,
  });
  if (!pos) throw notFound('Должность');

  if (department_id) {
    const deptWhere = { id: department_id, restaurant_id: restaurantId };

    const dept = await prisma.department.findFirst({
      where: deptWhere,
    });
    if (!dept) throw notFound('Указанный отдел');
  }

  if (name && name !== pos.name) {
    const existing = await prisma.position.findUnique({
      where: {
        restaurant_id_name: {
          restaurant_id: restaurantId,
          name,
        },
      },
    });
    if (existing) throw conflict('Должность с таким названием уже существует');
  }

  return prisma.position.update({
    where: { id },
    data: {
      name: name !== undefined ? name : pos.name,
      department_id: department_id !== undefined ? (department_id || null) : pos.department_id,
      order: order !== undefined ? order : pos.order,
    },
  });
};

const deletePosition = async (restaurantId, id) => {
  if (!restaurantId) throw badRequest('Не указан ресторан');
  const posWhere = { id, restaurant_id: restaurantId };

  const pos = await prisma.position.findFirst({
    where: posWhere,
  });
  if (!pos) throw notFound('Должность');

  await prisma.position.delete({ where: { id } });
  return { message: 'Должность успешно удалена' };
};

const reorderStructure = async (restaurantId, { departments, positions }) => {
  if (!restaurantId) throw badRequest('Не указан ресторан');

  // We will run all updates in a single transaction
  const updates = [];

  // Update department orders
  if (departments && Array.isArray(departments)) {
    for (const dept of departments) {
      updates.push(
        prisma.department.updateMany({
          where: { id: dept.id, restaurant_id: restaurantId },
          data: { order: dept.order },
        })
      );
    }
  }

  // Update position orders and department IDs
  if (positions && Array.isArray(positions)) {
    for (const pos of positions) {
      updates.push(
        prisma.position.updateMany({
          where: { id: pos.id, restaurant_id: restaurantId },
          data: { 
            order: pos.order,
            department_id: pos.department_id
          },
        })
      );
    }
  }

  if (updates.length > 0) {
    await prisma.$transaction(updates);
  }

  return { message: 'Структура успешно обновлена' };
};

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getPositions,
  createPosition,
  updatePosition,
  deletePosition,
  reorderStructure,
};
