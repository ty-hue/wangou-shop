# Next.js 13+ 字体加载机制深度理解

## `next/font/google` 到底做了什么

以 Inter 字体为例：

```tsx
import { Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});
```

### 第一步：构建时下载字体文件

Next.js 不会让浏览器去访问 Google Fonts，而是在 `yarn build` / `yarn dev` 时直接从 Google 下载 Inter 的 `.woff2` 字体文件到构建产物 `/.next/static/media/` 目录中。用户访问网站时，字体是从你自己的服务器加载的，无外部请求，隐私性好、速度快。

### 第二步：生成 `@font-face` 规则

Next.js 会自动在构建产物的全局 CSS 中生成 `@font-face` 声明：

```css
@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url(/_next/static/media/ba9851c3c22cd980-s.woff2) format("woff2");
  unicode-range: U+0460-052F, ...;
}
```

这一步让浏览器知道如何处理 Inter 字体。

### 第三步：生成一个 hash 类名

`inter.variable` 的值不是 `"--font-inter"` 字符串本身，而是 Next.js 自动生成的哈希类名，比如 `__variable_f367f3`。同时在构建产物的 CSS 中生成：

```css
.__variable_f367f3 {
  --font-inter: "Inter", "Inter Fallback";
}
```

`Inter Fallback` 是一个备选字体（由 local("Arial") 定义，有 size-adjust 调优），用于在字体加载过程中保持布局稳定，避免 CLS。

### 第四步：挂到 body 上

```tsx
<body className={inter.variable}>
```

`inter.variable` = `"__variable_f367f3"`，这个类名被挂到 body 上，于是 body 下面就有了 `--font-inter` 这个 CSS 变量，所有子元素都能通过 `var(--font-inter)` 拿到这个字体。

### 第五步：Tailwind 引用 （这一步也是在构建过程中自动完成的，不需要我们手动注册这个tailwind css类）

在 CSS 中通过 `@theme inline` 映射：

```css
@theme inline {
  --font-sans: var(--font-inter);
}
```

这样 Tailwind 的 `font-sans` 工具类就等于 `font-family: var(--font-inter)`。

## 完整链路总结

```
Inter({ variable: "--font-inter" })
     │
     ▼
① @font-face 定义字体（让浏览器知道怎么加载 .woff2）
     │
     ▼
② .__variable_xxx { --font-inter: 'Inter', 'Inter Fallback' }
   （通过 body 上的 hash 类名设置 CSS 变量）
     │
     ▼
③ --font-sans: var(--font-inter)
   （Tailwind 的 @theme inline 引用这个变量）
     │
     ▼
④ 你在组件中 className="font-sans" 来决定哪里用这个字体
```

## 关键认知

1. **Inter 默认不会自动应用到任何元素上**。它只是被定义了（`@font-face`），并通过 Tailwind 映射为 `font-sans` 工具类。是否使用完全取决于你是否在元素上写了 `font-sans`。
2. **`latin` 子集不包含中文字符**。Inter 字体本身也只含拉丁字符，中文会自动降级到系统默认字体（Windows 上是微软雅黑，macOS 上是苹方）。
3. **国内中文项目用 Inter 基本等于没用**。中文部分全部走系统回退，Inter 只对英文、数字、标点符号起效。对于纯中文的电商项目，直接删掉 Inter 用系统字体是更务实的做法。

---

# Next.js metadataBase 的作用

## 它解决什么问题

`metadataBase` 用于**给所有相对路径 URL 补全域名**，但注意：它不是给浏览器用的，是给**社交平台爬虫/搜索引擎**用的。

### 浏览器请求 vs 爬虫读取 meta 标签

**浏览器请求**：浏览器会自动补全域名 ✅

```
页面在 https://wangou-shop.com
<img src="/og.png">
→ 浏览器自动请求 https://wangou-shop.com/og.png ✓
```

**爬虫读取 meta 标签**：不会自动补全 ❌

```html
<meta property="og:image" content="/og.png" />
```

### 问题场景

当你在微信/Twitter 分享链接时：

1. **微信爬虫**去抓你的页面 HTML
2. 看到 `<meta property="og:image" content="/og.png">`
3. 微信爬虫**不会**访问你的网站去补全这个路径
4. 它直接拿这个字符串 `"/og.png"` 去显示
5. **结果**：分享卡片图片显示不出来

## 有 vs 没有 metadataBase

```tsx
// 没有 metadataBase
<meta property="og:image" content="/og.png">
// 微信爬虫拿到 "/og.png" → 无法显示图片 ❌

// 有 metadataBase: "https://wangou-shop.com"
<meta property="og:image" content="https://wangou-shop.com/og.png">
// 微信爬虫拿到完整 URL → 正常显示图片 ✅
```

## 典型配置

```tsx
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  openGraph: {
    images: ["/og.png"], // 相对路径，会被自动拼成完整 URL
  },
};
```

## 一句话总结

`metadataBase` 不是给浏览器用的，是给**社交平台爬虫/搜索引擎**用的——它们只读 HTML 里的 meta 标签字符串，不会像浏览器那样自动补全域名，所以需要 Next.js 在生成 meta 标签时就帮你拼好完整 URL。

---

# `new URL()` 构造函数的作用

`new URL()` 是 JavaScript 标准 API，用于**解析和构造 URL**。

## 基本用法

```ts
const url = new URL("https://wangou-shop.com:8080/products?id=1#top");
```

它会拆解 URL 的各个部分：

```ts
url.protocol; // "https:"
url.hostname; // "wangou-shop.com"
url.port; // "8080"
url.pathname; // "/products"
url.search; // "?id=1"
url.hash; // "#top"
url.origin; // "https://wangou-shop.com:8080"
url.href; // 完整 URL
```

## 常见场景

**1. 解析 URL 参数**

```ts
const url = new URL("https://api.example.com/list?page=1&size=10");
url.searchParams.get("page"); // "1"
url.searchParams.get("size"); // "10"
```

**2. 拼接相对路径**

```ts
const base = new URL("https://wangou-shop.com");
new URL("/og.png", base).href;
// "https://wangou-shop.com/og.png"
```

**3. 修改 URL**

```ts
const url = new URL("https://api.example.com/list");
url.searchParams.set("page", "2");
url.toString();
// "https://api.example.com/list?page=2"
```

## 在 metadataBase 中的作用

```ts
metadataBase: new URL("https://wangou-shop.com");
```

Next.js 内部就是用它来拼接相对路径：

```ts
new URL("/og.png", metadataBase).href;
// "https://wangou-shop.com/og.png"
```

## 一句话总结

`new URL()` 是标准的 URL 解析/构造工具，能拆解、拼接、修改 URL。Next.js 的 `metadataBase` 之所以要求传一个 `new URL()` 实例，是因为内部要用它来拼接相对路径生成完整 URL。

---

# Next.js 环境变量（.env）机制详解

## `.env` 文件是所有环境都会加载的

我之前以为 `.env` 文件只在生产环境才会注入到 `process.env`，其实不对。Next.js 会根据运行环境自动加载不同的 `.env` 文件，加载规则（从低到高优先级）：

```
.env                    ← 所有环境都会加载（默认配置）
.env.local              ← 所有环境都会加载（本地覆盖，优先级更高）
.env.development        ← 仅开发环境 (next dev)
.env.production         ← 仅生产环境 (next build / next start)
.env.production.local   ← 仅生产环境（本地覆盖）
```

所以 `.env` 是**所有环境都会加载**的通用配置文件，不区分开发/生产。

## `NEXT_PUBLIC_` 前缀的作用

这个前缀决定变量**暴露给客户端的程度**：

| 前缀           | 服务端 | 客户端（浏览器）            |
| -------------- | ------ | --------------------------- |
| `NEXT_PUBLIC_` | ✅     | ✅ 通过构建时内联到 JS 包中 |
| 无前缀         | ✅     | ❌ 仅服务端可访问           |

需要注意：`NEXT_PUBLIC_` 变量是**构建时**内联到客户端代码中的，不是运行时读取。所以：

```ts
// 这个在客户端代码中会被替换成字符串字面量
process.env.NEXT_PUBLIC_APP_NAME;
// 构建后实际变成：
("万购商城");
```

## 为什么代码里要写 `|| "默认值"`

```ts
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "万购商城";
```

我之前觉得："我自己在 `.env` 里写了变量，我自己肯定知道啊，为什么要写 `||`？"

原因是 `.env` 文件**不会被提交到 git**（`.gitignore` 里有 `.env*`），所以：

1. **团队协作**：同事 clone 项目后没有 `.env` 文件，`process.env` 是 `undefined`，没有 fallback 代码会报错
2. **CI/CD 环境**：构建服务器上可能没有 `.env` 文件，环境变量通过其他方式注入
3. **部署平台**：Vercel/Netlify 等平台通过控制台配置环境变量，不依赖 `.env` 文件
4. **防御性编程**：万一 `.env` 文件被误删或变量名拼错，代码不会崩溃

**什么时候可以不写 fallback**：如果这个变量必须有值才能运行，没有值应该直接报错，那就不用写 fallback，让它显式报错。

## `.local` 后缀是什么意思

`.local` 后缀表示**本地覆盖文件，永远不被提交到 git**，作用是**覆盖同名变量**。

文件命名规则：

```
.env                    ← 通用配置，可提交到 git
.env.local              ← 本地覆盖，不提交（所有环境）
.env.development        ← 开发环境配置，可提交
.env.development.local  ← 开发环境本地覆盖，不提交
.env.production         ← 生产环境配置，可提交
.env.production.local   ← 生产环境本地覆盖，不提交
```

比如：

`.env`：

```env
API_URL=https://api.example.com
```

`.env.local`：

```env
API_URL=http://localhost:3000
```

运行时 `.env.local` 的值会覆盖 `.env` 的值，所以 `API_URL` 最终是 `http://localhost:3000`。

同一环境下，`.local` 文件优先级最高：

```
.env.production.local  >  .env.local  >  .env.production  >  .env
```

## 关于 `.local` 的一个误区

我之前以为 `.local` 的"不提交到 git"特性很重要，但其实在我项目里 `.gitignore` 已经忽略了所有 `.env*` 文件，所以 `.local` 的"不提交"特性对我没有额外意义。

**在我项目里，`.local` 的唯一作用就是优先级更高，用于本地调试时覆盖某个变量。**

不过补充一下背景：**Next.js 官方推荐的 `.gitignore` 策略**和我项目当前做法不同。Next.js 官方建议：

```
.gitignore 里只忽略：
.env*.local
```

也就是说 `.env`、`.env.development`、`.env.production` 这些是**可以提交**到 git 的（团队共享默认值），只有 `.env*.local` 不提交（个人覆盖）。

| 文件               | 官方建议                  | 我的项目  |
| ------------------ | ------------------------- | --------- |
| `.env`             | ✅ 提交（团队共享默认值） | ❌ 不提交 |
| `.env.development` | ✅ 提交                   | ❌ 不提交 |
| `.env.production`  | ✅ 提交                   | ❌ 不提交 |
| `.env.local`       | ❌ 不提交（个人覆盖）     | ❌ 不提交 |
| `.env*.local`      | ❌ 不提交                 | ❌ 不提交 |

两种策略没有对错：官方建议更注重协作便利，我的做法更注重安全（避免任何敏感信息泄露）。

---

# next-themes 使用笔记

## 基本用法

`next-themes` 是一个专门为 Next.js 设计的主题管理库，核心解决两个问题：**服务端渲染时主题同步** 和 **客户端主题切换**。

### ThemeProvider 配置

```tsx
// app/layout.tsx
import { ThemeProvider } from "next-themes";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

| 配置项                      | 作用                                                     |
| --------------------------- | -------------------------------------------------------- |
| `attribute="class"`         | 在 `<html>` 标签上添加 `class="dark"` 或 `class="light"` |
| `defaultTheme="light"`      | 服务端渲染时的默认主题（没有 cookie 时使用）             |
| `enableSystem`              | 允许用户选择"跟随系统"模式                               |
| `disableTransitionOnChange` | 切换主题时禁用 CSS 过渡动画，避免闪烁                    |

### useTheme() 返回值

```tsx
const {
  theme, // 用户选择的模式："system" | "light" | "dark"
  resolvedTheme, // 实际生效的主题："light" | "dark"
  setTheme, // 设置主题的函数
  systemTheme, // 系统主题："light" | "dark"
} = useTheme();
```

**关键区别**：

| 返回值          | 含义               | 示例                             |
| --------------- | ------------------ | -------------------------------- |
| `theme`         | 用户**选择**的模式 | `"system"`（用户点了"跟随系统"） |
| `resolvedTheme` | 实际**生效**的主题 | `"dark"`（系统当前是暗色）       |
| `systemTheme`   | 操作系统的主题     | `"dark"`                         |

## 遇到的问题及解决方案

### 问题一：Hydration Mismatch（水合不匹配）

**现象**：选择暗色模式后刷新页面，控制台报错：

```
Hydration failed because the server rendered HTML didn't match the client.
```

**原因**：

1. 服务端渲染时，`next-themes` 无法读取 cookie（服务端没有 `window` 对象）
2. 服务端始终使用 `defaultTheme="light"`，所以渲染 `SunIcon`
3. 客户端 hydration 时，读取 cookie 发现主题是 `"dark"`，渲染 `MoonIcon`
4. 服务端 HTML 和客户端 DOM 不一致，触发 hydration mismatch

**解决方案**：

使用 `useEffect` 延迟客户端渲染，确保客户端主题检测完成后再显示组件：

```tsx
// components/shared/header/mode-toggle.tsx
const ModeToggle = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          {resolvedTheme === "dark" ? <MoonIcon /> : <SunIcon />}
        </Button>
      </DropdownMenuTrigger>
      {/* ... 下拉菜单内容 */}
    </DropdownMenu>
  );
};
```

**原理**：

- 服务端渲染时，`mounted` 是 `false`，返回 `null`（不渲染任何内容）
- 客户端 hydration 完成后，`useEffect` 触发，`mounted` 变成 `true`
- 此时主题检测已完成，`resolvedTheme` 是正确的值，显示正确的图标

### 问题二："跟随系统"模式下图标显示不正确

**现象**：选择"跟随系统"后，系统是暗色模式，但图标显示的是太阳（亮色）。

**原因**：

我之前的代码逻辑是：

```tsx
{
  theme === "system" ? (
    <SunIcon />
  ) : theme === "light" ? (
    <SunIcon />
  ) : (
    <MoonIcon />
  );
}
```

当 `theme === "system"` 时，我总是显示 `SunIcon`，但系统可能是暗色模式！

**解决方案**：

用 `resolvedTheme` 判断图标，用 `theme` 判断菜单项选中状态：

```tsx
// 图标显示：根据实际生效的主题
{resolvedTheme === "dark" ? <MoonIcon /> : <SunIcon />}

// 菜单项选中：根据用户选择的模式
<DropdownMenuCheckboxItem checked={theme === "system"}>跟随系统</DropdownMenuCheckboxItem>
<DropdownMenuCheckboxItem checked={theme === "light"}>亮色</DropdownMenuCheckboxItem>
<DropdownMenuCheckboxItem checked={theme === "dark"}>暗色</DropdownMenuCheckboxItem>
```

### 问题三：误解"跟随系统"的含义

**现象**：我以为"跟随系统"是跟随时间（白天亮色/晚上暗色），但实际上不是。

**原因**：

`next-themes` 的"跟随系统"是跟随**操作系统的外观设置**，不是跟随时间。

**验证方法**：

在浏览器控制台输入：

```js
window.matchMedia("(prefers-color-scheme: dark)").matches;
// true = 系统是暗色模式
// false = 系统是亮色模式
```

**总结**：

- ❌ "跟随系统" ≠ 白天亮色/晚上暗色
- ✅ "跟随系统" = 系统设置暗色 → 页面暗色；系统设置亮色 → 页面亮色

## 完整的 ModeToggle 组件

```tsx
"use client";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SunIcon, MoonIcon } from "lucide-react";

const ModeToggle = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          {resolvedTheme === "dark" ? <MoonIcon /> : <SunIcon />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuCheckboxItem
          checked={theme === "system"}
          onClick={() => setTheme("system")}
        >
          跟随系统
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={theme === "light"}
          onClick={() => setTheme("light")}
        >
          亮色
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={theme === "dark"}
          onClick={() => setTheme("dark")}
        >
          暗色
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ModeToggle;
```

## 主题切换的工作流程

```
1. 用户点击"暗色" → setTheme("dark")
2. next-themes 设置 cookie: theme=dark
3. next-themes 更新 <html class="dark">
4. Tailwind CSS 的 .dark 样式生效
5. 页面变成暗色模式

6. 用户刷新页面 → 服务端渲染（使用 defaultTheme="light"）
7. 客户端 hydration → 读取 cookie → theme="dark"
8. next-themes 更新 <html class="dark">
9. 页面变成暗色模式
```

## 注意事项

1. **服务端无法读取 cookie**：`next-themes` 在服务端始终使用 `defaultTheme`，不会读取请求中的 cookie。这是导致 hydration mismatch 的根本原因。
2. **`theme` 是用户选择的模式**：可能是 `"system"`，不要用它来判断图标显示。
3. **`resolvedTheme` 是实际生效的主题**：永远是 `"light"` 或 `"dark"`，适合用来判断图标显示。
4. **"跟随系统"依赖操作系统设置**：和时间无关，取决于用户在系统设置中选择的外观模式。

---

# Prisma Decimal 对象渲染报错问题

## 问题场景

我用 Prisma 从数据库查出来商品数据，传给 React 组件渲染，结果页面就崩了：

```
Console Error: Decimal objects cannot be rendered as text children.
```

报错位置是这样的：

```tsx
<p>{product.rating} 星</p>
```

我当时就懵了——`rating` 在数据库里不就是个数字吗（`Decimal(3,2)`），凭啥不能渲染？

## 原因

Prisma 从数据库查 `Decimal` 类型的字段时，返回的不是普通 JS 数字，而是一个 **Prisma 内部的 Decimal 对象**。React 不认识这个对象，不知道怎么把它变成页面上的文字，所以直接就报错了。

打个比方：你让一个人读出纸条上的内容，结果纸条是用阿拉伯文写的，他看不懂，就报错了。我直接把 Prisma 的 Decimal 对象丢给 React 渲染，React 也看不懂。

## 解决方案

### 方案一：每个渲染处手动转（笨办法）

```tsx
<p>{Number(product.rating)} 星</p>
```

能用，但每个地方都要写 `Number()`，容易漏。

### 方案二：在数据查询层统一洗一次（推荐）

在 `lib/utils.ts` 里写一个工具函数：

```ts
export function converToPlainObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
```

每次从数据库查完数据，先过一遍这个函数：

```ts
export async function getLatestProducts() {
  const data = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    take: 4,
  });
  return converToPlainObject(data); // ← 洗一下
}
```

之后组件里直接用，不再需要 `Number()`：

```tsx
<p>{product.rating} 星</p>  {/* 已经是普通数字了 */}
```

## 为什么 JSON.stringify 再 JSON.parse 就能解决问题

这就说到 Prisma 的 `Decimal` 类偷偷实现了一个叫 `toJSON()` 的方法。

`JSON.stringify` 在序列化一个对象时，会先去检查这个对象有没有 `toJSON()` 方法。如果有，就用 `toJSON()` 的返回值代替原对象：

```ts
// Prisma 内部的实现大概是这样的
class Decimal {
  toJSON() {
    return 4.5; // 序列化时返回普通数字
  }
}
```

所以流程是：

```
Decimal(4.5) → JSON.stringify 发现 toJSON() → 拿到 4.5 → 输出 "4.5"
                                                                       ↓
React 渲染 ← 普通数字 4.5 ← JSON.parse 还原对象 ← 这坨 JSON 字符串
```

整个过程等价于"把 Decimal 对象拆开摊平，重新组装成一个普通 JS 对象"，里面的 Decimal 都变成了普通数字。

## 传数组进去也能行

我一开始还有个困惑：`converToPlainObject` 接收的是一个数组（`prisma.product.findMany()` 返回的是数组），数组里套对象，对象里有 Decimal，这样也能洗吗？

答案是能。`JSON.stringify` 是递归的，它会**自动钻进去**：

```
数组 → 遍历每个元素 → 每个对象 → 遍历每个属性 → 遇到 Decimal → 调 toJSON() → 变成普通数字
```

就像你洗一串葡萄，不可能只洗表面那层皮，肯定是一颗一颗掰下来洗。`JSON.stringify` 也是一样，自动钻到最底层。

## 那其他类型的字段怎么办

普通的 `Int`、`Float`、`String` 不受影响。JSON 本来就有独立的数字类型，这些字段怎么进去就怎么出来，不会变成字符串。

只有 `Decimal` 这种 Prisma 内部的特殊类型才需要"洗一下"。

---

# Server Action（"use server"）的理解

## 我的疑问

我在写 `lib/actions/product-actions.ts` 时，纠结要不要加 `"use server"`。当时有个困惑：

```tsx
// 客户端组件里点按钮调这个函数
<button onClick={() => getLatestProducts()}>刷新</button>
```

这怎么可能成立？这是一个查数据库的函数，浏览器怎么执行得了？加了 `"use server"` 也不行吧？

## 解答

加了 `"use server"` 之后**真的能执行**。这就是 Next.js Server Action 的核心用途——客户端组件调用服务端函数。

### 原理

```ts
// product-actions.ts
"use server";

export async function getLatestProducts() {
  const data = await prisma.product.findMany(...); // 这行在服务端跑
  return data;
}
```

```tsx
// 客户端组件
"use client";

<button
  onClick={async () => {
    const products = await getLatestProducts(); // 浏览器发 POST 请求到服务端
    console.log(products); // 拿到的是服务端返回的数据
  }}
>
  刷新
</button>;
```

Next.js 会自动把加了 `"use server"` 的函数编译成一个 **POST API 端点**。客户端点按钮时，浏览器不是直接执行数据库查询，而是**偷偷发了一个 POST 请求**到你的服务端，服务端执行 `prisma.product.findMany()`，把结果返回给客户端。

### 本质

你写的是一行函数调用，Next.js 在背后把它拆成了：

```
客户端：发 POST 请求（自动生成） → 服务端：执行函数 → 返回结果 → 客户端：拿到结果
```

就像你在小程序里点了一个按钮，看起来只是调了一个函数，实际上背后走了一整套 HTTP 请求的流程。只是 Next.js 把这一切都帮你封装了，你完全感知不到。

### 什么时候需要加 "use server"

| 场景                                     | 要不要加                    |
| ---------------------------------------- | --------------------------- |
| 只在 Server Component 中调用             | ❌ 不需要，天生就在服务端跑 |
| 在 Client Component 中调用（如按钮点击） | ✅ 必须加                   |
| 表单提交（form action）                  | ✅ 加了才能做 Server Action |

### 我当前项目的情况

`getLatestProducts()` 只在 `page.tsx`（Server Component）里被调用：

```tsx
// app/(root)/page.tsx — Server Component，没有 "use client"
const products = await getLatestProducts(); // 自然运行在服务端 ✅
```

Server Component 里调用的函数天生在服务端执行，**不需要 "use server"**。

### 加上反而有副作用

加了 `"use server"` 后这个函数变成了 **Server Action**：

- 参数和返回值都要经过序列化边界
- 和 `as unknown as Product[]` 这种类型断言配合可能出问题
- 本来干净的服务端函数，不必要地变成了 API 端点

**结论**：我现在的场景不加就行。只有在客户端组件（"use client"）里需要调这个函数时，才加 `"use server"`。

---

# `import "server-only"` 是什么

## 我的疑问

看到 `db/db.ts` 最顶部有一行 `import "server-only"`，这个 import 没有导出任何东西，它是干嘛的？

## 解答

这是一个**编译期的安全锁**。它不在运行时做任何事，只在打包时起作用：如果有人不小心在客户端组件里引用了这个文件，**打包直接报错**。

## 为什么需要它

`db/db.ts` 里导出了一个单例的 `prisma` 实例，里面全是服务端才有的东西：数据库连接串、Prisma 适配器、Neon 驱动等等。如果哪个客户端组件不小心 import 了这个文件：

```tsx
// 某个 Client Component
"use client";
import prisma from "@/db/db"; // 危险行为！
```

打包器会把整条依赖链（Prisma、Neon 驱动……）全部打进浏览器 JS 包里。浏览器没有 `fs`、没有 TCP 连接能力、没有数据库驱动——直接就炸了，就像之前把 `pg` 和 `cn` 混在一个文件里那次一样。

有了 `"server-only"`，这种错误**在编译期就被拦住**，打包直接失败并告诉你原因，不会等到运行时才发现。

## 原理

`server-only` 这个 npm 包里其实就一行代码：

```js
throw new Error("This module cannot be imported from a Client Component");
```

打包器（webpack/turbopack）在解析 import 链时，发现你在浏览器端的打包上下文里引用了这个模块，就会执行这行 `throw`，直接停止构建。

**零运行时开销，纯粹的编译期检查。**

## 和 `"client-only"` 是对应的

| 包            | 作用                       |
| ------------- | -------------------------- |
| `server-only` | 防止服务端代码被客户端引用 |
| `client-only` | 防止客户端代码被服务端引用 |

两个都是同一个套路：包里只有一个 `throw`，靠打包器在编译期拦截。

## 什么文件该加

| 文件内容                      | 该加             |
| ----------------------------- | ---------------- |
| 数据库连接（prisma 实例）     | ✅ `server-only` |
| 文件系统操作（fs）            | ✅ `server-only` |
| 环境变量读取（SECRET_KEY 等） | ✅ `server-only` |
| 纯 UI 工具函数（cn）          | ❌ 不需要        |
| hooks（useState 等）          | ✅ `client-only` |

---

# `next/image` 的 `priority` 属性和 `width/height` 的作用

## 我的疑问

写 Header 组件的 logo 时，对 `<Image>` 组件有两个困惑：

1. `priority` 这个属性是干嘛的？
2. 我只设置了 `width={48} height={48}`，为什么任意尺寸的图片放进去都不会变形？

## `priority` 的作用

告诉 Next.js **"这张图片在首屏视口内，请优先加载"**。

具体做了三件事：

**1. 禁用懒加载**

`next/image` 默认会给图片加 `loading="lazy"`，只有滚动到可视区域才开始下载。加了 `priority` 后，图片直接去掉懒加载，网页打开后立刻加载。

**2. 提高加载优先级**

浏览器会给这张图分配更高的下载优先级。普通图片可能是 `Low` 优先级，加了 `priority` 后变成 `High`，提前抢占带宽。

**3. 消除 LCP 延迟**

LCP（Largest Contentful Paint，最大内容绘制）是 Google 衡量首屏加载速度的核心指标。logo 是用户在左上角第一眼看到的东西，属于典型的 LCP 元素。不加 `priority`，logo 会被懒加载，LCP 时间偏慢，Google 会扣你的 SEO 分数。

### 什么图片该加 priority

| 图片位置                       | 该加      |
| ------------------------------ | --------- |
| Header logo                    | ✅ 必须加 |
| 首屏 Hero 大图                 | ✅ 必须加 |
| 首屏商品主图                   | ✅ 建议加 |
| 列表中的商品图（需滚动才看到） | ❌ 不加   |
| 页脚图片                       | ❌ 不加   |

## `width/height` 为什么不会让图片变形

很多人第一次接触 `next/image` 都会被强制要求写 `width` 和 `height`，然后担心"我设了 48×48，那图片不就被拉伸成正方形了吗？"

其实不会。`next/image` 内部用了 `object-fit` 来控制图片怎么放进这个框里：

```
width={48} height={48}
  → 只是在页面上预留一个 48×48 的"展示框"
  → 图片本身按比例缩放，塞进这个框
  → 超出框的部分裁剪掉（默认 cover），或者缩到合适尺寸（contain）
```

它不会把长条形的图片拉伸成正方形——如果是长条图，就保持比例缩放到 48 宽或 48 高，然后用 `object-fit` 处理剩余部分。

### 那为什么要写 width 和 height

核心目的不是控制图片大小（那是 CSS 的事），而是**防止 Web Vitals 的 CLS（Cumulative Layout Shift，累计布局偏移）**。

如果图片不先声明尺寸，浏览器在图片下载完成前不知道它占多大位置，只能先按 0×0 渲染，等图片下载完了再把页面撑开，导致整个页面内容跳一下——这种"页面抖一下"就是 CLS，Google 扣分。

写 `width={48} height={48}` 相当于提前告诉浏览器："兄弟，这块地方是 48×48，你先帮我占好位子，图来了直接放进去。" 这样图片加载过程中页面不会到处移动，CLS 得分就漂亮了。

---

# Next.js 全栈开发的一个核心感悟

## 我的发现

做到现在我突然意识到一件事：我好像压根不需要 `axios` 或者 `fetch` 去请求什么东西了。

回想 Vue 单页应用的做法：

```
浏览器 → axios.get('/api/products') → Express 路由 → 查数据库 → 返回 JSON → 前端 setState
```

写了好几层，数据要经过 HTTP、JSON 序列化、state 管理，绕了一大圈。

而在 Next.js 里，我这些都没写：

```tsx
// page.tsx（Server Component）
const products = await getLatestProducts(); // 直接查数据库，没有 HTTP 层

// 或者 Client Component 里
const products = await getLatestProducts(); // Server Action，背后自动 POST 请求
```

数据库查询就写在组件旁边，中间没有 API Route、没有 axios、没有手动 JSON 处理。数据从数据库到页面的距离，就只有一行 `await`。

## 什么时候才需要 fetch / Route Handler

只有**跨项目边界**的时候才需要。说白了就是需要调外部服务的时候：

| 场景 | 要不要 fetch / API Route |
|------|--------------------------|
| 查自己的数据库 | ❌ Server Component 直接 `await prisma.xxx` |
| 表单提交 | ❌ Server Action 直接写数据库 |
| 调用微信支付 | ✅ 需要 Route Handler + fetch |
| 调用百度地图 API | ✅ 需要 |
| 接收 Webhook 推送 | ✅ 需要 Route Handler |
| 调用自己另一个微服务 | ✅ 需要 |
| 调用第三方短信服务 | ✅ 需要 |

判断标准很简单：**数据在"自己家"还是在"别人家"？自己家的数据直接拿，别人家的才需要 fetch。**

## 为什么要这样设计

Next.js 全栈模式把前后端合并成一套代码，它的哲学是：

> 能用函数调用解决的，不要用 HTTP 请求。

因为 HTTP 请求有成本：序列化、网络延迟、状态管理、错误处理。而直接函数调用：零网络开销、类型安全、异常冒泡自然。所以只要数据在本项目内，Next.js 就把 HTTP 层给你省了。

---

# Next.js 15 中 `params` 变成了 `Promise`

## 我的疑问

写商品详情页时，视频教程里 `params` 要通过 `await` 来拿：

```tsx
const ProductDetailPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params; // 为什么必须 await？
};
```

我印象中以前 Next.js 不是这样写的吧？以前 `params.id` 直接就能用。

## 原因

这是 Next.js 15 的**破坏性改动**，`params` 从普通对象变成了 `Promise`。

**旧版本（Next.js 14 及以前）**：

```tsx
// params 是同步对象，直接 . 就能拿到
const Page = ({ params }: { params: { id: string } }) => {
  return <div>{params.id}</div>; // 不需要 await
};
```

**新版本（Next.js 15+）**：

```tsx
// params 是 Promise，必须 await
const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return <div>{id}</div>;
};
```

## 为什么要改

Next.js 15 升级了底层的 React 渲染引擎。在新的渲染模型里，路由参数的解析流程是异步的：

```
用户访问 /product/123
  → 框架先匹配路由规则（/product/[id]）
  → 跑中间件
  → 跑布局组件
  → 然后才知道 [id] = "123"
  → 这个过程天然是异步的
```

以前的同步写法，其实是框架在背后偷偷帮你"等"完了再传过来——属于把异步流程包装成同步假象。新版本把这个异步本质**暴露出来**，让你显式 `await`，更诚实。

## 总结

- **Next.js 14**：`params.id` 直接用
- **Next.js 15+**：`await params` 然后 `.id`
- 你的视频教程用的应该是 15+ 版本，所以写了 `await`

---

# Prisma + PostgreSQL UUID 格式校验问题

## 问题场景

访问 `/product/15ea941a-ad19-496d-b71a-6f9e100a69b0x` 时，页面崩了，报错：

```
PrismaClientKnownRequestError
Invalid input value: invalid input syntax for type uuid:
"15ea941a-ad19-496d-b71a-6f9e100a69b0x"
```

报错位置：

```ts
export async function getProductById(id: string) {
  const data = await prisma.product.findUnique({
    where: { id },
  });
  return data;
}
```

我当时的第一反应：`findUnique` 查不到数据不是应该返回 `null` 吗？为什么会报错？

## 原因

`findUnique` 查不到记录确实返回 `null`，但它**根本没走到查询那一步**。

UUID `"15ea941a-ad19-496d-b71a-6f9e100a69b0x"` 末尾多了个 `x`，不是合法 UUID 格式。参数校验不是在 Prisma 层面做的，而是在 **PostgreSQL 数据库层面**：

1. Prisma 把 `id` 原样拼进 SQL：`WHERE "id" = '15ea941a-ad19-496d-b71a-6f9e100a69b0x'`
2. PostgreSQL 发现 `id` 列的类型是 `UUID`，尝试把字符串转成 UUID 类型
3. 转换失败，直接抛 `invalid input syntax for type uuid`
4. 错误传回 Prisma，包装成 `PrismaClientKnownRequestError`

整个过程里 SQL 根本没执行，数据库在参数转换阶段就把请求拒了。

打个比方：你去图书馆借书，给管理员一个编号 `"BOOK-001x"`，管理员一看说这编号格式不对，根本不帮你去书架找，直接把你拒了。你问"难道编号不存在不是应该告诉我'查无此书'吗"——问题是人家根本不觉得你这是个合法编号，连查都不给你查。

## 解决方案

在调 Prisma 之前，自己先做一层 UUID 格式校验：

```ts
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getProductById(id: string): Promise<Product | null> {
  if (!UUID_REGEX.test(id)) {
    return null; // 格式都不对，直接返回 null，让页面走 404
  }
  const data = await prisma.product.findUnique({
    where: { id },
  });
  return converToPlainObject(data);
}
```

这样：

- 合法 UUID 但数据库没这条记录 → `findUnique` 返回 `null` → 显示 404 ✅
- 非法 UUID 格式（多了 `x`、少了一截、乱码等）→ 正则拦截，直接返回 `null` → 显示 404 ✅

两种情况下用户都看到 404 页面，而不是 500 报错。

## 关键认知

**Prisma 本身不做参数类型校验**，它只是一个 SQL 生成器。`where: { id }` 里你传什么它就往 SQL 里拼什么，合不合法全看数据库能不能接受。真正的类型约束在数据库的列定义上（`UUID` 类型），校验也发生在数据库那边。所以遇到数据库类型约束的字段（UUID、Date 等），前端/路由层传过来的参数必须先在校验层兜一下，不能假设用户永远传合法值。

---

# Tailwind `col-span-{n}` 的作用

## 它是什么意思

`col-span-2` 表示该元素在 **CSS Grid** 中横跨 2 列。对应 CSS：

```css
grid-column: span 2 / span 2;
```

## 使用前提

父容器必须是 grid 布局且定义了列数：

```html
<div class="grid grid-cols-3 gap-4">
  <div>第1列</div>
  <div class="col-span-2">横跨第2-3列</div>
</div>
```

## 常用取值

| 类名            | 含义     |
| --------------- | -------- |
| `col-span-1`    | 占 1 列  |
| `col-span-2`    | 占 2 列  |
| `col-span-3`    | 占 3 列  |
| ...             | ...      |
| `col-span-12`   | 占 12 列 |
| `col-span-full` | 占满整行 |

## 和 `grid-area` 的区别

`grid-area` 也能实现跨列，但思维方式不同：

|            | `col-span-2`                        | `grid-area`                                      |
| ---------- | ----------------------------------- | ------------------------------------------------ |
| **定位方式**   | 相对：不管从哪开始，就占 2 列       | 绝对：指定起止行列线                             |
| **CSS 对应**  | `grid-column: span 2 / span 2`      | `grid-area: 1 / 1 / 2 / 3`（4 根网格线）        |
| **依赖**       | 不依赖起始位置，跟着文档流自动排     | 必须知道起止网格线编号                           |
| **适合场景**   | 排版型：某个元素就是比别的宽一点     | 布局型：精确控制每个元素的位置                   |

简单说：

- `col-span-2`：不管我在哪，给我占 2 列就行，像表格里合并单元格
- `grid-area`：我就要在左上角（第 1 行第 1 列→第 2 行第 3 列），精确到网格线

实际开发里 `col-span` 更常用，因为大多数情况只需要"某个元素宽一点"，没必要精确指定每根网格线。

---

# Server Component + form action 调用 Server Action 的技巧

## 场景

有一个下拉菜单组件，里面有一个"退出登录"按钮。按钮点了要调 `signOutUser()` 这个 Server Action。

## 两种实现方式

### 方案一：整个组件变成 Client Component（常见做法）

```tsx
"use client";

const UserButton = () => {
  const session = useSession(); // 客户端读取 session
  return (
    <DropdownMenu>
      <DropdownMenuItem onClick={() => signOutUser()}>
        退出登录
      </DropdownMenuItem>
    </DropdownMenu>
  );
};
```

代价：整个组件变成客户端组件，失去了服务端渲染（SEO 不友好，首屏慢）。

### 方案二：组件保持 Server Component，用 `form action` 触发（推荐）

```tsx
// user-button.tsx — Server Component
const UserButton = async () => {
  const session = await auth(); // 服务端直接读 session，不需要 useSession()
  return (
    <DropdownMenu>
      <form action={signOutUser}>
        <button type="submit">退出登录</button>
      </form>
    </DropdownMenu>
  );
};
```

Server Component 不能写 `onClick`/`onSelect`（那是客户端 API），但**可以写 `form action`**。因为 `form action` 是 HTML 原生属性，不依赖客户端 JS，浏览器直接提交表单触发 Server Action。

## 核心技巧

**Server Component 里需要触发 Server Action 时，用 form action 代替 onClick。**

因为：
- `onClick` / `onSelect` = 客户端事件，只能在 Client Component 里用
- `form action={serverAction}` = HTML 原生表单提交，Server Component 也能用
- 浏览器提交表单时自动发 POST 请求，服务端执行 Server Action，跳转由 `NEXT_REDIRECT` 完成

这样组件可以保持 Server Component，尽可能多地享受 SSR 带来的 SEO 和性能优势。

## 注意

如果组件内部有 UI 交互（如下拉菜单的 `DropdownMenuItem` 拦截了表单提交），只把需要交互的那一小部分抽成 Client Component，主体仍然保持 Server Component。比如我们把 `SignOutForm` 单独抽成了一个文件：

```tsx
// sign-out-form.tsx
"use client";

const SignOutForm = () => {
  return (
    <DropdownMenuItem
      onSelect={(e) => {
        e.preventDefault();
        (document.getElementById("signout-form") as HTMLFormElement).requestSubmit();
      }}
    >
      <form action={signOutUser} id="signout-form">
        <button type="submit">退出登录</button>
      </form>
    </DropdownMenuItem>
  );
};
```

整个 `UserButton`（读 session、渲染头像、展示用户名）仍然是 Server Component，只有退出登录这个有交互的部分是 Client Component。

---

# NextAuth `signOut()` 内部做了什么

调用 `signOut()` 后，NextAuth 在内部做了三件事：

**1. 删除 cookie**

删除 `next-auth.session-token` 这个加密 cookie。你的项目用的是 JWT 策略（`session: { strategy: "jwt" }`），登录状态全存在这个加密 cookie 里。删了 cookie 就是删了登录凭证，不需要查数据库。

**2. 清理服务端 session（仅 database 策略）**

如果你用的是 `session: { strategy: "database" }`，NextAuth 会去数据库的 `Session` 表里删掉对应记录。你用的是 JWT 策略，这一步直接跳过——JWT 状态下服务端没有 session 表要清理。

**3. 重定向到首页**

`signOut()` 调用后自动跳转到 `/`。和 `signIn()` 一样，它不是用 `next/navigation` 的 `redirect()`，而是通过抛出 `NEXT_REDIRECT` 来触发跳转。

想自定义跳转地址：

```ts
await signOut({ redirectTo: "/sign-in" });
```

## 关键认知

`signOut()` 走的是同样的"抛特殊错误"模式——它不是普通的 `return`，而是故意抛一个 `NEXT_REDIRECT` 让 Next.js 框架层去执行跳转。所以如果你在 try-catch 里包了 `signOut()`：

```ts
export async function signOutUser() {
  try {
    await signOut(); // ← 会抛 NEXT_REDIRECT
  } catch (error) {
    if (isRedirectError(error)) {
      throw error; // 必须原样往上抛，不能吞掉
    }
    return { success: false, message: "退出失败" };
  }
}
```

和 `signIn("credentials", ...)` 的 try-catch 模式完全一样，必须识别 `isRedirectError` 然后原样 `throw`，否则跳转就被你吃掉了，用户点了退出但页面没反应。"
