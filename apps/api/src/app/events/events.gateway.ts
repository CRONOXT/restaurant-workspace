import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('EventsGateway');

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinSucursal')
  handleJoinSucursal(@ConnectedSocket() client: Socket, @MessageBody() sucursalId: string) {
    client.join(`sucursal_${sucursalId}`);
    this.logger.log(`Client ${client.id} joined sucursal_${sucursalId}`);
    return { event: 'joined', data: `Joined sucursal_${sucursalId}` };
  }

  notifyTableOccupied(sucursalId: string, data: any) {
    this.server.to(`sucursal_${sucursalId}`).emit('tableOccupied', data);
  }

  notifyTableFreed(sucursalId: string, data: any) {
    this.server.to(`sucursal_${sucursalId}`).emit('tableFreed', data);
  }

  notifyNewOrder(sucursalId: string, data: any) {
    this.server.to(`sucursal_${sucursalId}`).emit('newOrder', data);
  }

  notifyOrderStatusChanged(sucursalId: string, data: any) {
    this.server.to(`sucursal_${sucursalId}`).emit('orderStatusChanged', data);
  }

  notifyComensalJoined(sucursalId: string, data: any) {
    this.server.to(`sucursal_${sucursalId}`).emit('comensalJoined', data);
  }

  notifyCloseRequested(sucursalId: string, data: any) {
    this.server.to(`sucursal_${sucursalId}`).emit('closeTableRequested', data);
  }

  notifyCloseApproved(sucursalId: string, data: any) {
    this.server.to(`sucursal_${sucursalId}`).emit('closeTableApproved', data);
  }

  notifyCloseRejected(sucursalId: string, data: any) {
    this.server.to(`sucursal_${sucursalId}`).emit('closeTableRejected', data);
  }
}
