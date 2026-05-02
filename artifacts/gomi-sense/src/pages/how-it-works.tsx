import { useAppStore } from "@/lib/store";
import { Recycle, RefreshCcw, Settings, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HowItWorks() {
  const { language } = useAppStore();

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-500">
      <section className="text-center pt-8 pb-4">
        <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4 text-primary">
          <Settings className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-3">
          {language === "ja" ? "日本のゴミ分別のしくみ" : "How Waste Sorting Works in Japan"}
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto text-lg">
          {language === "ja" 
            ? "なぜ日本はこれほど複雑な分別ルールを持っているのでしょうか？" 
            : "Understanding the reasoning behind Japan's rigorous waste management rules."}
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-md bg-card overflow-hidden">
          <div className="h-2 w-full bg-blue-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Recycle className="h-5 w-5 text-blue-500" />
              {language === "ja" ? "資源の限られた国" : "A Resource-Scarce Nation"}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {language === "ja"
                ? "日本は国土が狭く、天然資源に乏しいため、リサイクルを極限まで高める必要があります。ゴミを燃やすことや埋め立てることを最小限に抑えています。"
                : "With limited land and natural resources, Japan relies heavily on recycling. Minimizing incineration and landfill usage is a national priority."}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-0 shadow-md bg-card overflow-hidden">
          <div className="h-2 w-full bg-green-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPinIcon className="h-5 w-5 text-green-500" />
              {language === "ja" ? "自治体ごとのルール" : "Municipality Specific"}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {language === "ja"
                ? "日本のゴミ処理施設は市町村ごとに異なります。高性能な焼却炉を持つ市もあれば、細かく手作業で分別する市もあります。"
                : "Waste processing facilities vary wildly by city. Some cities have high-tech incinerators that can handle diverse plastics; others rely on strict manual sorting."}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-0 shadow-md bg-card overflow-hidden">
          <div className="h-2 w-full bg-amber-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCcw className="h-5 w-5 text-amber-500" />
              {language === "ja" ? "焼却とプラスチック" : "Incineration & Plastics"}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {language === "ja"
                ? "燃えるゴミに出せるプラスチックの種類は、自治体の焼却炉の温度に依存します。そのため、隣の街とはルールが違うことがよくあります。"
                : "Whether a plastic item is 'burnable' depends on the temperature of local incinerators. This is why rules change completely when moving to a neighboring city."}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-0 shadow-md bg-card overflow-hidden">
          <div className="h-2 w-full bg-purple-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-purple-500" />
              {language === "ja" ? "きれいに洗う" : "Clean Before Disposal"}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {language === "ja"
                ? "リサイクル資源として回収されるものは、汚れを洗い落とす必要があります。汚れたものは「燃えるゴミ」になる場合があります。"
                : "Items marked for recycling (like PET bottles or cans) must be rinsed. Dirty recyclables often have to be classified as burnable waste instead."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <section className="mt-8 bg-secondary/50 rounded-2xl p-6 md:p-8 border border-secondary text-center">
        <h2 className="text-xl font-bold mb-4">
          {language === "ja" ? "GomiSenseの役割" : "How GomiSense Helps"}
        </h2>
        <p className="text-muted-foreground">
          {language === "ja" 
            ? "私たちは各自治体の複雑なガイドラインを収集し、AIを使ってアイテムとルールをマッチングさせます。分厚い冊子をめくる代わりに、検索するだけで正しい答えがわかります。" 
            : "We digest complex, city-specific guidelines and use AI to map your specific items to those rules. No more flipping through thick municipal booklets."}
        </p>
      </section>
    </div>
  );
}

import { MapPin as MapPinIcon } from "lucide-react";
