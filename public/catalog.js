export const games = [
  ['neon-nest','Neon Nest','Retro kart racing','Tiny wheels. Very big city.','Solo · 2–8 players','tap',true,'#9d7cff','🏎️'],
  ['cloud-hopper','Cloud Hopper','Sky climber','Catch an updraft. Find your rhythm.','Solo · 2–4 players','precision',false,'#7ee8ff','☁️'],
  ['bad-egg','Bad Egg','Social deduction','Your crew has a little secret.','Practice · 4–8 players','memory',true,'#ff728f','🕵️'],
  ['egg-on-the-run','Egg on the Run','Fly & dodge','One egg. A very risky escape.','Solo · 2–8 players','dodge',false,'#ffb75e','🚀'],
  ['frost-hop','Frost Hop','Precision jumper','Nice landing. Now keep moving.','Solo · 2–4 players','precision',false,'#9ce8f7','❄️'],
  ['egg-pop','Egg Pop','Bubble shooter','Make a match. Start a chain reaction.','Solo · 2 players','pop',false,'#ff83ca','🫧'],
  ['shell-shock','Shell Shock','Reaction duel','Blink and the yolk is on you.','Solo · 2 players','reflex',true,'#ffc857','⚡'],
  ['yolk-yards','Yolk Yards','Obstacle dash','Shortcut responsibly.','Solo · 2–6 players','dodge',false,'#7be495','🏁'],
  ['scramble','Scramble','Memory sprint','Remember fast. Crack nothing.','Solo · 2 players','memory',false,'#e6a8ff','🧠'],
  ['sunny-side-up','Sunny Side Up','Timing challenge','Stop the sun at exactly right.','Solo','precision',false,'#ffdb6e','🌞'],
  ['pecking-order','Pecking Order','Tap battle','Fast fingers rule the roost.','Solo · 2–8 players','tap',true,'#f28f3b','🐔'],
  ['nest-defense','Nest Defense','Arcade defense','Protect the nest. No pressure.','Solo','pop',false,'#73d2de','🛡️'],
  ['eggclipse','Eggclipse','Reflex','Wait for darkness. Then move.','Solo · 2 players','reflex',true,'#6c63ff','🌘'],
  ['omelette-orbit','Omelette Orbit','Space dodge','Gravity is having a day.','Solo','dodge',false,'#8aa4ff','🪐'],
  ['shell-stack','Shell Stack','Precision stacker','Higher is better. Wobblier too.','Solo','precision',false,'#61d095','🥚'],
  ['coop-coupe','Coop Coupe','Sprint race','Floor it. Feathers optional.','Solo · 2–8 players','tap',true,'#f45b69','🚗'],
  ['eggorithm','Eggorithm','Pattern memory','The sequence knows if you guessed.','Solo','memory',false,'#b8f2e6','🔢'],
  ['breakfast-breakout','Breakfast Breakout','Arcade pop','Escape brunch before brunch escapes you.','Solo · 2 players','pop',false,'#ffa69e','🍳']
].map(([slug,title,genre,tagline,players,engine,multiplayer,accent,emoji]) => ({slug,title,genre,tagline,players,engine,multiplayer,accent,emoji}));

export const getGame = slug => games.find(game => game.slug === slug);
