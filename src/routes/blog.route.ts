import { Hono } from "hono";
import { verify } from "hono/jwt";
import { PrismaClient } from "../generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const router = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

router.use("/*", async (c, next) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")?.at(1) || "";
    const jwtContent = await verify(token, c.env.JWT_SECRET, "HS256");
    if (!jwtContent) {
      return c.json(
        {
          message: "Unauthorized",
        },
        403,
      );
    }

    c.set("jwtPayload", jwtContent.userId);
    await next();
  } catch (e) {
    return c.json(
      {
        message: "Invalid",
      },
      411,
    );
  }
});

//create blog
router.post("/", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  try {
    const userId = String(c.get("jwtPayload"));
    if (!userId) {
      return c.json(
        {
          message: "Unauthorized",
        },
        403,
      );
    }
    const blog = await prisma.blog.create({
      data: {
        title: body.title,
        content: body.content,
        authorId: userId,
      },
    });

    return c.json(
      {
        message: "Successfully uploaded",
        blog: blog,
      },
      201,
    );
  } catch (e) {
    return c.json(
      {
        message: "Invalid",
      },
      411,
    );
  }
});

//update blog
router.put("/", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  try {
    const userId = String(c.get("jwtPayload"));
    if (!userId) {
      return c.json(
        {
          message: "Unauthorized",
        },
        403,
      );
    }
    const updatedBlog = await prisma.blog.update({
      where: {
        id: body.blogId,
      },
      data: {
        title: body.title,
        content: body.content,
      },
    });

    return c.json(
      {
        message: "Updated Blog",
        updatedBlog: updatedBlog,
      },
      200,
    );
  } catch (e) {
    return c.json(
      {
        message: "Invalid",
      },
      411,
    );
  }
});

//get all blogs
router.get("/bulk", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const blogs = await prisma.blog.findMany({});

    return c.json(
      {
        message: "Updated Blog",
        blogs: blogs,
      },
      200,
    );
  } catch (e) {
    return c.json(
      {
        message: "Invalid",
      },
      411,
    );
  }
});

//get blog
router.get("/:id", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const blogId = c.req.param("id");
  try {
    const userId = String(c.get("jwtPayload"));
    if (!userId) {
      return c.json(
        {
          message: "Unauthorized",
        },
        403,
      );
    }
    const blog = await prisma.blog.findUnique({
      where: {
        id: blogId,
      },
    });

    return c.json(
      {
        message: "Updated Blog",
        blog: blog,
      },
      200,
    );
  } catch (e) {
    return c.json(
      {
        message: "Invalid",
      },
      411,
    );
  }
});
export default router;
