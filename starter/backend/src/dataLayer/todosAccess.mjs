import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { createLogger } from '../utils/logger.mjs'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const logger = createLogger('TodoAccess');
const url_expiration = process.env.SIGNED_URL_EXPIRATION;

export class TodosAccess {
    constructor(
        dynamoDb = DynamoDBDocument.from(new DynamoDB()),
        todosTable = process.env.TODOS_TABLE,
        todosIndex = process.env.TODOS_CREATED_AT_INDEX,
        S3 = new S3Client(),
        s3_bucket_name = process.env.ATTACHMENT_S3_BUCKET
    ) {
        this.dynamoDb = dynamoDb
        this.S3 = S3
        this.todosTable = todosTable
        this.todosIndex = todosIndex
        this.bucket_name = s3_bucket_name
    }

    async createTodo(todo) {
        logger.debug('create todo');

        try {
            await this.dynamoDb.put({
                TableName: this.todosTable,
                Item: todo,
            })

            return todo
        } catch (e) {
            logger.error('Create Error: ' + e.message)
            return null
        }
    }

    async updateTodo(userId, todoId, updateToDoRequest) {
        logger.debug('update todo');

        try {
            await this.dynamoDb.update({
                TableName: this.todosTable,
                Key: {
                    userId,
                    todoId,
                },
                UpdateExpression:
                    'set #name = :name, #dueDate = :dueDate, #done = :done',
                ExpressionAttributeNames: {
                    '#name': 'name',
                    '#dueDate': 'dueDate',
                    '#done': 'done',
                },
                ExpressionAttributeValues: {
                    ':name': updateToDoRequest.name,
                    ':dueDate': updateToDoRequest.dueDate,
                    ':done': updateToDoRequest.done,
                },
                ReturnValues: 'UPDATED_NEW',
            })

            return true
        } catch (e) {
            logger.error('Update Error: ' + e.message)
            return false
        }
    }

    async updateAttachmentPresignedUrl(userId, todoId) {
        logger.debug('update attachment')
        try {

            const command = new PutObjectCommand({
                Bucket: this.bucket_name,
                Key: todoId
            })

            const url = await getSignedUrl(this.S3, command, {
                expiresIn: parseInt(url_expiration)
            })

            await this.dynamoDb
                .update({
                    TableName: this.todosTable,
                    Key: {
                        userId,
                        todoId,
                    },
                    UpdateExpression: 'set attachmentUrl = :URL',
                    ExpressionAttributeValues: {
                        ':URL': url.split('?')[0],
                    },
                    ReturnValues: 'UPDATED_NEW',
                })

            return url

        } catch (e) {
            logger.error('Update attachment Error: ' + e.message)
            return null
        }
    }

    async deteteTodo(userId, todoId) {
        logger.debug('delete todo')
        try {
            await this.dynamoDb.delete({
                TableName: this.todosTable,
                Key: {
                    userId,
                    todoId,
                },
            })

            return true
        } catch (e) {
            logger.error('Delete Error: ' + e.message)
            return false
        }
    }

    async getAll(userId) {
        logger.debug('get all');

        const result = await this.dynamoDb.query({
            TableName: this.todosTable,
            IndexName: this.todosIndex,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        })

        return result.Items
    }
}
