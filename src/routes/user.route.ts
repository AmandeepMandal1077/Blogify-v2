import { Hono } from "hono";
import { PrismaClient } from "../generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { sign } from "hono/jwt";

const router = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

router.post("/signup", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  try {
    const user = await prisma.user.create({
      data: {
        email: body.email,
        username: body.username,
        password: body.password,
        name: body.name,
      },
    });

    const token = await sign(
      {
        userId: user.id,
      },
      c.env.JWT_SECRET,
      "HS256",
    );

    return c.json({
      meessage: "Signed Up",
      jwtToken: token,
    });
  } catch (e) {
    c.status(411);
    return c.text("Invalid");
  }
});

router.post("/signin", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  try {
    const user = await prisma.user.findFirst({
      where: {
        username: body.username,
        password: body.password,
      },
    });

    if (!user) {
      return c.text("Forbidden", 403);
    }

    const token = await sign(
      {
        userId: user!.id,
      },
      c.env.JWT_SECRET,
      "HS256",
    );

    return c.json({
      message: "logged in",
      jwtToken: token,
    });
  } catch (e) {
    c.status(411);
    return c.text("Invalid");
  }
});

export default router;
