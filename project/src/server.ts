import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { SimpleGame } from './game/SimpleGame';
import { GameEnvironment } from './environment/GameEnvironment';
import { DQNAgent } from './ai/DQNAgent';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.static(path.join(__dirname, '../public')));

const game = new SimpleGame();
const env = new GameEnvironment(game);
const agent = new DQNAgent(9, 3); // 9 state values, 3 actions

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('start_training', async () => {
    const episodes = 100;
    
    for (let episode = 0; episode < episodes; episode++) {
      env.reset();
      let state = env.getState();
      let done = false;
      let totalReward = 0;

      while (!done) {
        const action = await agent.chooseAction(state);
        env.applyAction(env.actions[action]);
        
        const nextState = env.getState();
        const reward = env.getReward();
        done = env.isDone();
        
        agent.remember(state, action, reward, nextState, done);
        await agent.replay();
        
        totalReward += reward;
        state = nextState;

        // Send game state to client
        socket.emit('game_state', {
          player: game.getPlayer(),
          goal: game.getGoal(),
          obstacles: game.getObstacles(),
          reward: totalReward,
          episode: episode + 1
        });

        await new Promise(resolve => setTimeout(resolve, 100)); // Slow down visualization
      }

      agent.updateEpsilon();
    }
  });
});

httpServer.listen(3000, () => {
  console.log('Server running on port 3000');
});