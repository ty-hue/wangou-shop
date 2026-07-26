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
  return converToPlainObject(data);  // ← 洗一下
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
    return 4.5;  // 序列化时返回普通数字
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

