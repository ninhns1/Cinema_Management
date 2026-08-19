class RealtimePublisher {
  constructor(io, pubClient, subClient) {
    this.io = io;
    this.pubClient = pubClient;
    this.subClient = subClient;
    this.channel = "seat.events";
  }

  async init() {
    await this.subClient.subscribe(this.channel);
    this.subClient.on("message", (channel, message) => {
      if (channel !== this.channel) return;
      const payload = JSON.parse(message);
      this.io.to(payload.showtimeId).emit("seat.updated", payload);
    });
  }

  async broadcast(payload) {
    await this.pubClient.publish(this.channel, JSON.stringify(payload));
  }
}

module.exports = { RealtimePublisher };
