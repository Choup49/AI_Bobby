import * as tf from '@tensorflow/tfjs';

interface Experience {
  state: number[];
  action: number;
  reward: number;
  nextState: number[];
  done: boolean;
}

export class DQNAgent {
  private readonly stateSize: number;
  private readonly actionSize: number;
  private readonly learningRate: number;
  private readonly gamma: number;
  private epsilon: number;
  private readonly epsilonDecay: number;
  private readonly minEpsilon: number;
  private readonly batchSize: number;
  private readonly memorySize: number;
  private memory: Experience[];
  private model: tf.LayersModel;

  constructor(
    stateSize: number,
    actionSize: number,
    learningRate = 0.001,
    gamma = 0.99,
    epsilon = 1.0,
    epsilonDecay = 0.995,
    minEpsilon = 0.01,
    batchSize = 32,
    memorySize = 2000
  ) {
    this.stateSize = stateSize;
    this.actionSize = actionSize;
    this.learningRate = learningRate;
    this.gamma = gamma;
    this.epsilon = epsilon;
    this.epsilonDecay = epsilonDecay;
    this.minEpsilon = minEpsilon;
    this.batchSize = batchSize;
    this.memorySize = memorySize;
    this.memory = [];
    this.model = this.buildModel();
  }

  private buildModel(): tf.LayersModel {
    const model = tf.sequential();
    
    model.add(tf.layers.dense({
      units: 64,
      activation: 'relu',
      inputShape: [this.stateSize]
    }));
    
    model.add(tf.layers.dropout({ rate: 0.2 }));
    
    model.add(tf.layers.dense({
      units: 128,
      activation: 'relu'
    }));
    
    model.add(tf.layers.dropout({ rate: 0.2 }));
    
    model.add(tf.layers.dense({
      units: this.actionSize,
      activation: 'linear'
    }));

    model.compile({
      optimizer: tf.train.adam(this.learningRate),
      loss: 'meanSquaredError'
    });

    return model;
  }

  public remember(state: number[], action: number, reward: number, nextState: number[], done: boolean): void {
    if (this.memory.length >= this.memorySize) {
      this.memory.shift();
    }
    this.memory.push({ state, action, reward, nextState, done });
  }

  public async chooseAction(state: number[]): Promise<number> {
    if (Math.random() < this.epsilon) {
      return Math.floor(Math.random() * this.actionSize);
    }

    const stateTensor = tf.tensor2d([state]);
    const prediction = await this.model.predict(stateTensor) as tf.Tensor;
    const action = await prediction.argMax(1).data();
    
    stateTensor.dispose();
    prediction.dispose();
    
    return action[0];
  }

  public async replay(): Promise<void> {
    if (this.memory.length < this.batchSize) return;

    const batch = this.sampleBatch();
    const states = tf.tensor2d(batch.map(exp => exp.state));
    const nextStates = tf.tensor2d(batch.map(exp => exp.nextState));

    const currentQs = await this.model.predict(states) as tf.Tensor;
    const futureQs = await this.model.predict(nextStates) as tf.Tensor;

    const updatedQs = await currentQs.array();

    for (let i = 0; i < batch.length; i++) {
      const { action, reward, done } = batch[i];
      const futureQ = done ? 0 : (await futureQs.slice([i, 0], [1, this.actionSize]).max().data())[0];
      updatedQs[i][action] = reward + this.gamma * futureQ;
    }

    await this.model.fit(states, tf.tensor2d(updatedQs), {
      epochs: 1,
      verbose: 0
    });

    states.dispose();
    nextStates.dispose();
    currentQs.dispose();
    futureQs.dispose();
  }

  private sampleBatch(): Experience[] {
    const batchIndices = new Array(this.batchSize)
      .fill(0)
      .map(() => Math.floor(Math.random() * this.memory.length));
    return batchIndices.map(index => this.memory[index]);
  }

  public updateEpsilon(): void {
    this.epsilon = Math.max(this.minEpsilon, this.epsilon * this.epsilonDecay);
  }
}