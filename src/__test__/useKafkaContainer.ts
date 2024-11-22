import {
  KafkaContainer,
  type StartedKafkaContainer,
} from '@testcontainers/kafka'
import {
  type Admin,
  type Consumer,
  type ITopicConfig,
  Kafka,
  type Producer,
} from 'kafkajs'
import { v4 as uuidv4 } from 'uuid'
import { afterAll, afterEach, beforeAll, beforeEach, expect } from 'vitest'

function createKafkaTestContext(
  container: StartedKafkaContainer,
  admin: Admin,
  producer: Producer,
  consumer: Consumer,
  consumerGroupId: string,
  randomTopicName: string
): KafkaTestContext {
  return {
    kafka: {
      container,
      admin,
      producer,
      consumer,
      consumerGroupId,
      randomTopicName,
    },
  }
}

export interface KafkaTestContext {
  kafka: {
    container: StartedKafkaContainer
    admin: Admin
    producer: Producer
    consumer: Consumer
    consumerGroupId: string
    randomTopicName: string
  }
}

export function useKafkaContainer(exposedPort = 9093) {
  let container: StartedKafkaContainer
  let kafka: Kafka

  function createTopicConfig(topic: string): ITopicConfig {
    return {
      topic: topic,
      numPartitions: 1,
      replicationFactor: 1,
    }
  }

  async function createRandomTopic(admin: Admin) {
    const topic = uuidv4()
    const config: ITopicConfig = {
      topic,
      numPartitions: 1,
      replicationFactor: 1,
    }

    await admin.createTopics({ timeout: 5_000, topics: [config] })

    return topic
  }

  beforeAll(async () => {
    container = await new KafkaContainer('confluentinc/cp-kafka:7.7.1')
      .withKraft()
      .withExposedPorts(exposedPort, 9094)
      .start()

    const host = container.getHost()
    const port = container.getMappedPort(exposedPort)

    kafka = new Kafka({
      clientId: 'my-client-id',
      brokers: [`${host}:${port}`],
      ssl: false,
    })
  }, 90_000)

  afterAll(async () => {
    if (container) {
      await container.stop({
        remove: true,
        removeVolumes: true,
      })
    }
  })

  beforeEach<KafkaTestContext>(async (context) => {
    const admin = kafka.admin()
    await admin.connect()

    const randomTopicName = await createRandomTopic(admin)
    const topicConfig = createTopicConfig(randomTopicName)

    await admin.createTopics({
      topics: [topicConfig],
      timeout: 5_000,
    })

    await expect
      .poll(async () => await admin.listTopics(), { timeout: 5_000 })
      .toEqual(expect.arrayContaining([randomTopicName]))

    const producer = kafka.producer({
      allowAutoTopicCreation: false, // Should be set up by the test, or fail
      retry: {
        retries: 5,
        initialRetryTime: 1_000,
        maxRetryTime: 10_000,
      },
      transactionTimeout: 5_000,
    })

    const consumerGroupId = `consumer-${uuidv4()}`
    const consumer = kafka.consumer({
      groupId: consumerGroupId,
    })

    context.kafka = createKafkaTestContext(
      container,
      admin,
      producer,
      consumer,
      consumerGroupId,
      randomTopicName
    ).kafka

    await producer.connect()
    await consumer.connect()
  }, 90_000)

  afterEach<KafkaTestContext>(async (context) => {
    const { admin, consumer, producer } = context.kafka

    await producer.disconnect()
    await consumer.disconnect()
    await admin.disconnect()
  }, 90_000)
}
