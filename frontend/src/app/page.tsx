"use client";

import { useState } from "react";
import Link from "next/link";
import Reveal, { RevealGroup } from "@/components/ui/Reveal";

const AGENTS = [
  { icon: "💻", name: "Веб-разработчик", desc: "Создаёт сайты и лендинги по описанию" },
  { icon: "🎨", name: "Дизайнер", desc: "Логотипы, баннеры и фирменный стиль" },
  { icon: "📢", name: "Маркетолог", desc: "Контент-планы, реклама и копирайтинг" },
  { icon: "👥", name: "CRM-менеджер", desc: "Настройка воронок продаж и CRM" },
  { icon: "🎧", name: "Поддержка", desc: "Чат-бот для клиентского сервиса" },
  { icon: "🔍", name: "SEO-специалист", desc: "Аудит, ключевые слова и оптимизация" },
  { icon: "📊", name: "Аналитик", desc: "Отчёты, дашборды и аналитика данных" },
];

const STEPS = [
  { num: "01", title: "Опишите идею", desc: "Расскажите о своём бизнесе в свободной форме — AI поймёт контекст", icon: "💡" },
  { num: "02", title: "Получите команду", desc: "Координатор подберёт нужных агентов под ваш проект", icon: "🤖" },
  { num: "03", title: "Запустите бизнес", desc: "Агенты создадут сайт, дизайн, стратегию и настроят процессы", icon: "🚀" },
];

const PRICING = [
  {
    name: "Free",
    price: "0",
    period: "",
    models: ["GPT-4o Mini", "DeepSeek V3", "Gemini 2.5 Flash"],
    imageModels: ["DALL-E 2"],
    features: ["10 000 токенов/день", "3 изображения/день", "5 проектов"],
    cta: "Начать бесплатно",
    popular: false,
  },
  {
    name: "Basic",
    price: "990",
    period: "/мес",
    models: ["GPT-5 Mini", "Claude Opus 4", "Claude Sonnet 4", "DeepSeek V3"],
    imageModels: ["DALL-E 2", "DALL-E 3"],
    features: ["50 000 токенов/день", "10 изображений/день", "15 проектов"],
    cta: "Попробовать",
    popular: false,
  },
  {
    name: "Pro",
    price: "2 490",
    period: "/мес",
    models: ["GPT-5.2", "Claude Opus 4.5", "Claude Sonnet 4.5", "Gemini 2.5 Pro", "DeepSeek V3"],
    imageModels: ["DALL-E 3", "GPT Image 1"],
    features: ["200 000 токенов/день", "50 изображений/день", "50 проектов", "Свой домен"],
    cta: "Выбрать Pro",
    popular: true,
  },
  {
    name: "Ultra",
    price: "4 990",
    period: "/мес",
    models: ["GPT-5.4", "Claude Opus 4.6", "Claude Sonnet 4.6", "DeepSeek V3.2 Thinking", "Gemini 3 Pro"],
    imageModels: ["DALL-E 3", "GPT Image 1"],
    features: ["500 000 токенов/день", "200 изображений/день", "200 проектов", "API-доступ", "White label"],
    cta: "Выбрать Ultra",
    popular: false,
  },
];

const TESTIMONIALS = [
  { name: "Алексей К.", role: "Основатель интернет-магазина", text: "Запустил магазин за 2 дня вместо двух месяцев. AI-разработчик сделал сайт, дизайнер — логотип, маркетолог — первую рекламную кампанию." },
  { name: "Мария С.", role: "Владелица кофейни", text: "Раньше я тратила тысячи на фрилансеров. Теперь один сервис заменяет целый штат — и работает 24/7." },
  { name: "Дмитрий В.", role: "Стартап-фаундер", text: "Идеально для MVP. Описал идею — получил сайт, CRM и маркетинговый план за один вечер." },
];

const FAQ_ITEMS = [
  { q: "Что такое AI-агент?", a: "AI-агент — это виртуальный специалист, который решает конкретные бизнес-задачи через чат. Каждый агент обучен на узкой области: веб-разработка, дизайн, маркетинг и т.д." },
  { q: "Нужны ли технические знания?", a: "Нет. Вы описываете задачу обычным языком, а агент выполняет всю техническую работу. Это как переписка с экспертом." },
  { q: "Могу ли я подключить свой домен?", a: "Да, на тарифах Pro и Ultra можно привязать собственный домен к сгенерированному сайту." },
  { q: "Как работает бесплатный тариф?", a: "Бесплатный тариф включает 10 000 токенов в день и 3 изображения. Этого достаточно, чтобы попробовать платформу и создать первый проект." },
  { q: "Какие LLM используются?", a: "Платформа поддерживает несколько провайдеров: OpenAI (GPT-4.1, o3), Anthropic (Claude Opus 4), Google (Gemini 2.5 Pro), DeepSeek. Набор моделей зависит от вашего тарифа." },
  { q: "Можно ли экспортировать результаты?", a: "Да. Сайты скачиваются в виде HTML/ZIP, тексты и планы доступны для копирования, а отчёты экспортируются в популярных форматах." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-border/50 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-btn bg-accent text-lg font-bold text-white">
              A
            </span>
            <span className="text-lg font-bold text-foreground tracking-tight">AIBC</span>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm text-foreground/60">
            <a href="#how" className="hover:text-foreground transition-colors">Как это работает</a>
            <a href="#agents" className="hover:text-foreground transition-colors">Агенты</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Тарифы</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </div>
          <Link
            href="/login"
            className="rounded-btn bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
          >
            Войти
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-6 py-24 text-center lg:py-32 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-indigo-200/60 to-purple-200/40 blur-[100px] pointer-events-none" />
        <div className="absolute -top-20 right-0 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-pink-200/50 to-orange-100/40 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-[350px] h-[350px] rounded-full bg-gradient-to-br from-blue-200/40 to-cyan-100/30 blur-[100px] pointer-events-none" />

        <Reveal direction="up">
          <span className="mb-4 inline-block rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
            Платформа для предпринимателей
          </span>
        </Reveal>
        <Reveal direction="up" delay={150}>
          <h1 className="mx-auto mb-6 max-w-3xl text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
            Соберите бизнес за{" "}
            <span className="text-accent">один день</span>
          </h1>
        </Reveal>
        <Reveal direction="up" delay={300}>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-foreground/60 leading-relaxed">
            Виртуальная команда AI-агентов вместо найма сотрудников. Сайт, дизайн,
            CRM, маркетинг, поддержка — всё через один интерфейс.
          </p>
        </Reveal>
        <Reveal direction="up" delay={450}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="rounded-btn bg-accent px-8 py-4 text-base font-semibold text-white shadow-card hover:bg-accent-hover hover:shadow-card-hover transition-all"
            >
              Начать бесплатно
            </Link>
            <a
              href="#how"
              className="rounded-btn border border-border px-8 py-4 text-base font-medium text-foreground/70 hover:bg-gray-50 transition-all"
            >
              Как это работает
            </a>
          </div>
        </Reveal>

        <Reveal direction="up" delay={100}>
          <div className="mt-20 grid grid-cols-3 gap-8 border-t border-border pt-10">
            {[
              { value: "500+", label: "бизнесов запущено" },
              { value: "7", label: "AI-агентов в команде" },
              { value: "24/7", label: "работа без выходных" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-bold text-foreground">{s.value}</p>
                <p className="text-sm text-foreground/50">{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* How it works */}
      <section id="how" className="relative bg-gradient-to-b from-indigo-50/50 via-white to-white py-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[300px] rounded-full bg-purple-100/40 blur-[100px] pointer-events-none" />
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <div className="mb-16 text-center">
              <h2 className="mb-3 text-3xl font-bold text-foreground">Как это работает</h2>
              <p className="text-foreground/50">Три шага от идеи до запуска</p>
            </div>
          </Reveal>
          <RevealGroup stagger={150} className="grid gap-8 md:grid-cols-3">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className="h-full rounded-card bg-white p-8 shadow-card hover:shadow-card-hover transition-all duration-150"
              >
                <span className="mb-4 inline-block text-4xl">{step.icon}</span>
                <p className="mb-2 text-xs font-bold text-accent">{step.num}</p>
                <h3 className="mb-2 text-xl font-semibold text-foreground">{step.title}</h3>
                <p className="text-foreground/50 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Agent showcase */}
      <section id="agents" className="relative py-24 overflow-hidden">
        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] rounded-full bg-gradient-to-tr from-pink-100/50 to-orange-100/30 blur-[100px] pointer-events-none" />
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <div className="mb-16 text-center">
              <h2 className="mb-3 text-3xl font-bold text-foreground">Ваша AI-команда</h2>
              <p className="text-foreground/50">Каждый агент — специалист в своей области</p>
            </div>
          </Reveal>
          <RevealGroup stagger={80} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AGENTS.map((agent) => (
              <div
                key={agent.name}
                className="h-full group rounded-card border border-border bg-white p-6 hover:border-accent/40 hover:shadow-card-hover hover:scale-[1.02] transition-all duration-150"
              >
                <span className="mb-3 inline-block text-3xl group-hover:scale-110 transition-transform">{agent.icon}</span>
                <h3 className="mb-1 font-semibold text-foreground">{agent.name}</h3>
                <p className="text-sm text-foreground/50">{agent.desc}</p>
              </div>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative bg-gradient-to-b from-indigo-50/40 via-purple-50/20 to-white py-24 overflow-hidden">
        <div className="absolute top-20 left-0 w-[350px] h-[350px] rounded-full bg-blue-100/40 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-purple-100/30 blur-[100px] pointer-events-none" />
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <div className="mb-16 text-center">
              <h2 className="mb-3 text-3xl font-bold text-foreground">Тарифы</h2>
              <p className="text-foreground/50">Начните бесплатно, масштабируйтесь когда будете готовы</p>
            </div>
          </Reveal>
          <RevealGroup stagger={120} className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`relative h-full rounded-card bg-white p-6 transition-all duration-150 ${
                  plan.popular
                    ? "border-2 border-accent shadow-card-hover scale-[1.02]"
                    : "border border-border shadow-card hover:shadow-card-hover"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-xs font-semibold text-white">
                    Популярный
                  </span>
                )}
                <h3 className="mb-1 text-lg font-bold text-foreground">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && <span className="text-foreground/40"> ₽{plan.period}</span>}
                  {!plan.period && <span className="text-foreground/40"> ₽</span>}
                </div>

                {/* Features */}
                <ul className="mb-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground/70">
                      <span className="text-green-500">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* AI Models */}
                <div className="mb-4 border-t border-border pt-3">
                  <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wide mb-2">AI-модели</p>
                  <div className="flex flex-wrap gap-1">
                    {plan.models.map((m) => (
                      <span key={m} className="inline-block rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Image Models */}
                <div className="mb-5 border-t border-border pt-3">
                  <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wide mb-2">Генерация изображений</p>
                  <div className="flex flex-wrap gap-1">
                    {plan.imageModels.map((m) => (
                      <span key={m} className="inline-block rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-medium text-pink-600">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <Link
                  href="/login"
                  className={`block w-full rounded-btn py-3 text-center text-sm font-semibold transition-colors ${
                    plan.popular
                      ? "bg-accent text-white hover:bg-accent-hover"
                      : "border border-border text-foreground hover:bg-gray-50"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <div className="mb-16 text-center">
              <h2 className="mb-3 text-3xl font-bold text-foreground">Что говорят пользователи</h2>
            </div>
          </Reveal>
          <RevealGroup stagger={150} className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="h-full rounded-card border border-border bg-white p-6 shadow-card"
              >
                <p className="mb-4 text-foreground/70 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="font-semibold text-foreground">{t.name}</p>
                  <p className="text-sm text-foreground/40">{t.role}</p>
                </div>
              </div>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-gradient-to-b from-white to-indigo-50/30 py-24">
        <div className="mx-auto max-w-3xl px-6">
          <Reveal>
            <div className="mb-16 text-center">
              <h2 className="mb-3 text-3xl font-bold text-foreground">Частые вопросы</h2>
            </div>
          </Reveal>
          <RevealGroup stagger={100} className="space-y-3">
            {FAQ_ITEMS.map((item) => (
              <FaqItem key={item.q} question={item.q} answer={item.a} />
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-soft opacity-60 pointer-events-none" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <Reveal direction="scale">
            <h2 className="mb-4 text-3xl font-bold text-foreground">Готовы начать?</h2>
            <p className="mb-8 text-foreground/50">
              Создайте бесплатный аккаунт и соберите свою AI-команду за 5 минут
            </p>
            <Link
              href="/login"
              className="inline-block rounded-btn bg-accent px-8 py-4 text-base font-semibold text-white shadow-card hover:bg-accent-hover hover:shadow-card-hover transition-all"
            >
              Начать бесплатно
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white py-12">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <div className="grid gap-8 sm:grid-cols-4">
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-btn bg-accent text-sm font-bold text-white">
                    A
                  </span>
                  <span className="font-bold text-foreground">AIBC</span>
                </div>
                <p className="text-sm text-foreground/40">AI-платформа для предпринимателей</p>
              </div>
              <div>
                <h4 className="mb-3 text-sm font-semibold text-foreground">Продукт</h4>
                <ul className="space-y-2 text-sm text-foreground/50">
                  <li><a href="#agents" className="hover:text-foreground transition-colors">Агенты</a></li>
                  <li><a href="#pricing" className="hover:text-foreground transition-colors">Тарифы</a></li>
                  <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
                </ul>
              </div>
              <div>
                <h4 className="mb-3 text-sm font-semibold text-foreground">Компания</h4>
                <ul className="space-y-2 text-sm text-foreground/50">
                  <li><a href="#" className="hover:text-foreground transition-colors">О нас</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Контакты</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Блог</a></li>
                </ul>
              </div>
              <div>
                <h4 className="mb-3 text-sm font-semibold text-foreground">Правовая информация</h4>
                <ul className="space-y-2 text-sm text-foreground/50">
                  <li><a href="#" className="hover:text-foreground transition-colors">Политика конфиденциальности</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Оферта</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-10 border-t border-border pt-6 text-center text-xs text-foreground/30">
              © 2026 AI Business Constructor. Все права защищены.
            </div>
          </Reveal>
        </div>
      </footer>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-card border border-border bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <span className="font-medium text-foreground">{question}</span>
        <span className={`text-foreground/40 transition-transform duration-200 text-xl leading-none ${open ? "rotate-45" : ""}`}>
          +
        </span>
      </button>
      {open && (
        <div className="px-6 pb-4 text-sm text-foreground/60 leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}
