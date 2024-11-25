"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DQNAgent = void 0;
const tf = __importStar(require("@tensorflow/tfjs"));
class DQNAgent {
    constructor(stateSize, actionSize, learningRate = 0.001, gamma = 0.99, epsilon = 1.0, epsilonDecay = 0.995, minEpsilon = 0.01, batchSize = 32, memorySize = 2000) {
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
    buildModel() {
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
    remember(state, action, reward, nextState, done) {
        if (this.memory.length >= this.memorySize) {
            this.memory.shift();
        }
        this.memory.push({ state, action, reward, nextState, done });
    }
    async chooseAction(state) {
        if (Math.random() < this.epsilon) {
            return Math.floor(Math.random() * this.actionSize);
        }
        const stateTensor = tf.tensor2d([state]);
        const prediction = await this.model.predict(stateTensor);
        const action = await prediction.argMax(1).data();
        stateTensor.dispose();
        prediction.dispose();
        return action[0];
    }
    async replay() {
        if (this.memory.length < this.batchSize)
            return;
        const batch = this.sampleBatch();
        const states = tf.tensor2d(batch.map(exp => exp.state));
        const nextStates = tf.tensor2d(batch.map(exp => exp.nextState));
        const currentQs = await this.model.predict(states);
        const futureQs = await this.model.predict(nextStates);
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
    sampleBatch() {
        const batchIndices = new Array(this.batchSize)
            .fill(0)
            .map(() => Math.floor(Math.random() * this.memory.length));
        return batchIndices.map(index => this.memory[index]);
    }
    updateEpsilon() {
        this.epsilon = Math.max(this.minEpsilon, this.epsilon * this.epsilonDecay);
    }
}
exports.DQNAgent = DQNAgent;
