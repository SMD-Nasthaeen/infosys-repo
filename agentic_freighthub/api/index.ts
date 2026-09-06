import { app } from "../src/backend/app";

export default (req: any, res: any) => {
  return app(req, res);
};
