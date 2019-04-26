
struct Canvas {
    1:string opts
}
service CanvasServer {
  string draw(1: string opts);
}