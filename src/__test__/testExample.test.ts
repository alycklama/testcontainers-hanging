import { describe, expect, it } from 'vitest'
import { type KafkaTestContext, useKafkaContainer } from './useKafkaContainer'
import type { Message } from 'kafkajs'

type LocalTestContext = KafkaTestContext

describe('the testcontainers', () => {
  useKafkaContainer()

  async function testFunction(context: LocalTestContext) {
    const { consumer, producer, randomTopicName } = context.kafka

    const message: Message = { value: 'hello world' }

    await producer.send({ topic: randomTopicName, messages: [message] })

    const consumedValues: (string | undefined)[] = []

    await consumer.subscribe({ topic: randomTopicName, fromBeginning: true })
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        consumedValues.push(message.value?.toString('utf-8'))
      },
    })

    await expect
      .poll(() => {
        return consumedValues
      })
      .toStrictEqual(['hello world'])
  }

  it<LocalTestContext>('should not hang 1', async (context) => {
    await testFunction(context)
  })

  it<LocalTestContext>('should not hang 2', async (context) => {
    await testFunction(context)
  })

  it<LocalTestContext>('should not hang 3', async (context) => {
    await testFunction(context)
  })

  it<LocalTestContext>('should not hang 4', async (context) => {
    await testFunction(context)
  })

  it<LocalTestContext>('should not hang 5', async (context) => {
    await testFunction(context)
  })
})
