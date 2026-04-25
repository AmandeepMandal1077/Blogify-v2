import { Hono } from "hono";
import { verify } from "hono/jwt";
import { PrismaClient } from "../generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import {
  createBlogBodySchema,
  updateBlogBodySchema,
} from "@amandeepmandal/common";

const router = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    jwtPayload: string;
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
  const { success } = createBlogBodySchema.safeParse(body);
  if (!success) {
    c.status(411);
    return c.text("Invalid");
  }
  try {
    const userId = c.get("jwtPayload");
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
  const { success } = updateBlogBodySchema.safeParse(body);
  if (!success || !body.blogId) {
    c.status(411);
    return c.text("Invalid");
  }
  try {
    const userId = c.get("jwtPayload");
    if (!userId) {
      return c.json(
        {
          message: "Unauthorized",
        },
        403,
      );
    }

    const data: { title?: string; content?: string } = {};
    if (body.title) data.title = body.title;
    if (body.content) data.content = body.content;

    const updatedBlog = await prisma.blog.update({
      where: {
        id: body.blogId,
      },
      data,
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
    const userId = c.get("jwtPayload");
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
