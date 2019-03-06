# EOS Autostake

This is a simple script for running scheduled staking or claiming tasks.

## Warning

Do not use this if you don't know what you are doing :) There I've said it.

## Example Contracts

pixEOS - Stake any unstaked pixEOS every 24 hours
betDice - Claim betDice dividends every wednesday

## Running

```bash
node autostake.js
```

## Persisting

```bash
npm install pm2 -g
pm2 start autostake.json
pm2 save
```

To run pm2 on system startup:

```bash
pm2 startup 

> then follow instructions
```