import * as uuid from 'uuid'
import { TodosAccess } from '../dataLayer/todosAccess.mjs';
import { createLogger } from '../utils/logger.mjs'
import { AttachmentUtils } from '../fileStorage/attachmentUtils.mjs';

const logger = createLogger('Todos');
const todosAccess = new TodosAccess();
// const attachmentUtils = new AttachmentUtils();

export async function getTodosForUser(userId) {
    logger.debug('get list todo');
    return await todosAccess.getAll(userId);
}

export async function createTodo(createTodoRequest, userId) {
    logger.debug('create new todo');

    const todoId = uuid.v4()
    const createdAt = new Date().toISOString();
    // const s3AttachUrl = attachmentUtils.getAttachmentUrl(todoId);
    const todoItem = {
        todoId: todoId,
        userId: userId,
        createdAt,
        done: false,
        attachmentUrl: null,
        name: createTodoRequest.name,
        dueDate: createTodoRequest.dueDate
    }

    return await todosAccess.createTodo(todoItem);
}

export async function updateTodo(userId, todoId, updateToDoRequest) {
    logger.debug('update todo by id');
    return await todosAccess.updateTodo(userId, todoId, updateToDoRequest);
}

export async function updateAttachmentPresignedUrl(userId, todoId) {
    logger.debug('update an attachment');
    return await todosAccess.updateAttachmentPresignedUrl(userId, todoId);
}

export async function deleteTodo(userId, todoId) {
    logger.debug('delete todo');
    return await todosAccess.deteteTodo(userId, todoId);
}
