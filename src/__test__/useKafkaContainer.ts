import { KafkaJS } from '@confluentinc/kafka-javascript'
import {
  KafkaContainer,
  type StartedKafkaContainer,
} from '@testcontainers/kafka'
import { v4 as uuidv4 } from 'uuid'
import { afterAll, afterEach, beforeAll, beforeEach, expect } from 'vitest'

function createKafkaTestContext(
  container: StartedKafkaContainer,
  admin: KafkaJS.Admin,
  consumer: KafkaJS.Consumer
): KafkaTestContext {
  return {
    kafka: {
      container,
      admin,
      consumer,
    },
  }
}

interface KafkaTestContext {
  kafka: {
    container: StartedKafkaContainer
    admin: KafkaJS.Admin
    consumer: KafkaJS.Consumer
  }
}

export function useKafkaContainer(exposedPort = 9093) {
  let container: StartedKafkaContainer
  let kafka: KafkaJS.Kafka

  function createTopicConfig(topic: string): KafkaJS.ITopicConfig {
    return {
      topic: topic,
      numPartitions: 1,
      replicationFactor: 1,
    }
  }

  async function createRandomTopic(admin: KafkaJS.Admin) {
    const topic = uuidv4()
    const config: KafkaJS.ITopicConfig = {
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
      .withStartupTimeout(90_000)
      .start()

    const host = container.getHost()
    const port = container.getMappedPort(exposedPort)

    kafka = new KafkaJS.Kafka({
      kafkaJS: {
        clientId: 'my-client-id',
        brokers: [`${host}:${port}`],
        ssl: false,
      },
    })
  }, 60_000)

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

    const consumerGroupId = `consumer-${uuidv4()}`
    const consumer = kafka.consumer({
      kafkaJS: {
        groupId: consumerGroupId,
      },
    })

    context.kafka = createKafkaTestContext(container, admin, consumer).kafka

    await consumer.connect()
  }, 60_000)

  afterEach<KafkaTestContext>(async (context) => {
    const { admin, consumer } = context.kafka

    await consumer.disconnect()
    await admin.disconnect()
  }, 60_000)
}
