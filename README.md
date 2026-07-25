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
