import BeforeAfterSlider from "./components/BeforeAfterSlider";
import HoverClickGallery from "./components/HoverClickGallery";
import InteractiveDemo from "./components/InteractiveDemo";
import QuantitativeTable from "./components/QuantitativeTable";
import fs from "fs";
import path from "path";

export default async function Home() {
  // Discover all result triplets in public/results at build/render time
  const resultsDir = path.join(process.cwd(), "public", "results");
  let galleryItems: { id: string; originalSrc: string; resultSrc: string; maskSrc: string }[] = [];
  try {
    const entries = await fs.promises.readdir(resultsDir);
    const tripletPresence: Record<string, { original: boolean; result: boolean; mask: boolean }> = {};

    const filenamePattern = /^img_(\d+)_(original|result|mask)\.png$/;
    for (const name of entries) {
      const match = name.match(filenamePattern);
      if (!match) continue;
      const index = match[1];
      const kind = match[2] as "original" | "result" | "mask";
      if (!tripletPresence[index]) {
        tripletPresence[index] = { original: false, result: false, mask: false };
      }
      tripletPresence[index][kind] = true;
    }

    const indices = Object.keys(tripletPresence)
      .filter((k) => {
        const t = tripletPresence[k];
        return t.original && t.result && t.mask;
      })
      .map((k) => Number(k))
      .sort((a, b) => a - b);

    galleryItems = indices.map((i) => ({
      id: String(i),
      originalSrc: `/results/img_${i}_original.png`,
      resultSrc: `/results/img_${i}_result.png`,
      maskSrc: `/results/img_${i}_mask.png`,
    }));
  } catch {
    galleryItems = [];
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-5xl font-normal leading-tight mb-8 px-4 flex flex-col items-center">
            <span className="flex items-center gap-2">
              <span className="bg-gradient-to-r from-black via-yellow-400 to-cyan-400 bg-clip-text text-transparent">CPAM</span>
              <img src="/magic_wand.png" alt="Eraser" className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 inline-block" />
              <span className="text-cyan-600">: Context-Preserving Adaptive Manipulation</span>
            </span>
            <span className="text-cyan-600">for Zero-Shot Real Image Editing</span>
          </h1>

          {/* Authors */}
          <div className="text-lg md:text-xl mb-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <span>
              <a href="https://orcid.org/0000-0001-8831-8846" target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:text-sky-600 hover:underline">
                Dinh-Khoi Vo
              </a><sup>1,2</sup>
            </span>
            <span>
              <a href="https://orcid.org/0000-0002-6249-0848" target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:text-sky-600 hover:underline">
                Thanh-Toan Do
              </a><sup>3</sup>
            </span>
            <span>
              <a href="#" target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:text-sky-600 hover:underline">
                Tam V. Nguyen
              </a><sup>4</sup>
            </span>
            <span>
              <a href="https://orcid.org/0000-0003-3046-3041" target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:text-sky-600 hover:underline">
                Minh-Triet Tran
              </a><sup>1,2</sup>
            </span>
            <span>
              <a href="https://orcid.org/0000-0002-7363-2610" target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:text-sky-600 hover:underline">
                Trung-Nghia Le
              </a><sup>1,2</sup>
            </span>
          </div>

          {/* Affiliations */}
          <div className="text-base md:text-lg mb-4 flex flex-col items-center justify-center gap-y-2">
            <span>
              <sup>1</sup>University of Science, VNU-HCM, Ho Chi Minh City, Vietnam
            </span>
            <span>
              <sup>2</sup>Vietnam National University, Ho Chi Minh City, Vietnam
            </span>
            <span>
              <sup>3</sup>Monash University, Melbourne, Victoria, Australia
            </span>
            <span>
              <sup>4</sup>University of Dayton, Ohio, United States
            </span>
          </div>

          {/* Email */}
          <div className="text-base mb-8 italic">
            vdkhoi@selab.hcmus.edu.vn, toan.do@monash.edu, tamnguyen@udayton.edu, &#123;tmtriet, ltnghia&#125;@fit.hcmus.edu.vn
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-8 mb-12">
            <a
              href="https://arxiv.org/abs/2506.18438"
              className="px-6 py-3 bg-slate-600 hover:bg-slate-500 rounded border border-slate-500 transition-colors"
              rel="noopener noreferrer"
            >
              arXiv
            </a>
            <a
              href="#"
              className="px-6 py-3 bg-slate-600 hover:bg-slate-500 rounded border border-slate-500 transition-colors cursor-not-allowed opacity-75 relative"
              title="Coming soon"
            >
              Code
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded-full font-bold transform rotate-12">
                Soon
              </span>
            </a>
            <a
              href="#"
              className="px-6 py-3 bg-slate-600 hover:bg-slate-500 rounded border border-slate-500 transition-colors cursor-not-allowed opacity-75 relative"
              title="Coming soon"
            >
              Gradio Demo
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded-full font-bold transform rotate-12">
                Soon
              </span>
            </a>

      
          </div>
                    {/* Teaser Image - At the very top */}
          <div className="mb-12">
            <img src="/teaser.png" alt="CPAM Teaser" className="w-full max-w-4xl mx-auto rounded-lg shadow-lg" />
          </div>
        </div>
      </section>

      {/* Abstract Section */}
      <section className="py-12 px-4 bg-gray-100 text-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-8">
            <h2 className="text-3xl font-bold uppercase min-w-fit">Abstract</h2>
            <p className="text-lg leading-relaxed">
              Editing natural images using textual descriptions in text-to-image diffusion models remains a significant challenge, particularly in achieving consistent generation and handling complex, non-rigid objects. Existing methods often struggle to preserve textures and identity, require extensive fine-tuning, and exhibit limitations in editing specific spatial regions or objects while retaining background details. This paper proposes Context-Preserving Adaptive Manipulation (CPAM), a novel zero-shot framework for complicated, non-rigid real image editing. Specifically, we propose a preservation adaptation module that adjusts self-attention mechanisms to preserve and independently control the object and background effectively. This ensures that the objects&apos; shapes, textures, and identities are maintained while keeping the background undistorted during the editing process using the mask guidance technique. Additionally, we develop a localized extraction module to mitigate the interference with the non-desired modified regions during conditioning in cross-attention mechanisms. We also introduce various mask-guidance strategies to facilitate diverse image manipulation tasks in a simple manner. Extensive experiments on our newly constructed Image Manipulation BenchmArk (IMBA), a robust benchmark dataset specifically designed for real image editing, demonstrate that our proposed method is the preferred choice among human raters, outperforming existing state-of-the-art editing techniques.
            </p>
          </div>
        </div>
      </section>
  

      <section className="py-16 px-4 bg-gray-100 text-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold uppercase text-center mb-6">Approach</h2>
          <div>
            <p className="text-lg leading-relaxed mb-6">
              We propose Context-Preserving Adaptive Manipulation (CPAM) to edit an image  
             <i> I<sub>s</sub></i> using a source object mask <i>M<sub>s</sub></i> through 
            the <code>MaskInputModule</code>, which can derive the mask in various ways, 
            such as manual drawing, click-based extraction, or text prompts using SAM 
            and a target text prompt <i>P<sub>t</sub></i> to generate a new image 
            <i> I<sub>t</sub></i> that aligns with <i>P<sub>t</sub></i>. Notably, 
            <i> I<sub>t</sub></i> may spatially differ from <i>I<sub>s</sub></i>, 
            modifying objects or background while keeping other regions unchanged. 
            To achieve this, we introduce a preservation adaptation module that adjusts 
            self-attention to align the semantic content from intermediate latent noise 
            to the current edited noise, ensuring the retention of the original object 
            and background during the editing process. To prevent unwanted changes from 
            the target prompt in non-desired modified regions, we propose a localized 
            extraction module that enables targeted editing while preserving the remaining 
            details. Additionally, we propose mask-guidance strategies for diverse image 
            manipulation tasks. Below are the overall CPAM architecture , 
            and the zero-shot editing algorithm.
            </p>

            {/* Approach Diagrams */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-center mb-4 text-gray-800">Overall Architecture</h3>
                <img
                  src="/Overall_Pipeline.png"
                  alt="Overall Pipeline Diagram"
                  className="w-full h-auto rounded"
                />
              </div>
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-center mb-4 text-gray-800">Detail Mechanism</h3>
                <img
                  src="/detail_mechanism.png"
                  alt="Detail Mechanism Diagram"
                  className="w-full h-auto rounded"
                />
              </div>
            </div>

            {/* Algorithm Diagram */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-center mb-4 text-gray-800">Zero-Shot Editing Algorithm</h3>
              <img
                src="/algorithm.png"
                alt="Zero-Shot Editing Algorithm"
                className="w-full h-auto rounded"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Qualitative Comparison Section */}
      <section className="py-16 px-4 bg-white text-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold uppercase text-center mb-6">Qualitative Comparison</h2>
          
          <p className="text-lg text-gray-700 leading-relaxed mb-8 max-w-4xl mx-auto">
            Figure shows a qualitative comparison of CPAM against leading state-of-the-art image editing techniques. Our results demonstrate that CPAM consistently outperforms existing methods across various real image editing tasks, including object replacement, view/pose changes, object removal, background alteration, and addition of new objects. CPAM excels in its ability to modify diverse aspects of images while effectively preserving the original background and avoiding unintended modifications to non-target regions.
          </p>

          {/* Qualitative Comparison Image */}
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <img
              src="/qualitative.png"
              alt="Qualitative comparison of object removal methods"
              className="w-full h-auto rounded shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Quantitative Comparison Section */}
      <section className="py-16 px-4 bg-gray-50 text-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold uppercase text-center mb-6">Quantitative Comparison</h2>
          
          <p className="text-lg text-gray-700 leading-relaxed mb-12 max-w-5xl mx-auto text-center">
            We conduct comprehensive quantitative evaluations and user studies to assess the effectiveness of CPAM against state-of-the-art image editing methods. We evaluate methods using multiple metrics including functional capabilities, text-image alignment (CLIPScore), background preservation (LPIPS), and subjective user ratings across key dimensions. Our evaluation dataset, IMBA (Image Manipulation BenchmArk), comprises 104 carefully curated samples with detailed annotations for diverse editing tasks including object retention, modification, and background alteration.
          </p>
          
          {/* Table 1: Functional Capabilities */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 mb-12">
            <h3 className="text-xl font-semibold text-center mb-4 text-gray-800">Functional Capabilities Comparison</h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              Functional comparison across editing methods. ✓ indicates supported features, ✗ indicates not supported. <span className="font-semibold">Local Edit:</span> region-specific editing. <span className="font-semibold">Obj. Removal:</span> object removal capability. <span className="font-semibold">Caption-Free:</span> no original image caption required. <span className="font-semibold">Mask Ctrl:</span> mask-based region control. <span className="font-semibold">Hi-Guidance:</span> compatibility with high classifier-free guidance scales.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Method</th>
                    <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Local Edit</th>
                    <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Obj. Removal</th>
                    <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Caption-Free</th>
                    <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Mask Ctrl</th>
                    <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Hi-Guidance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">SDEdit</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✗</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✗</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✓</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✗</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✗</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">MasaCtrl</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✓</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✗</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✓</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✓</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✗</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">PnP</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✗</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✗</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✗</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✗</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✗</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">FPE</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✗</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✗</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✗</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✗</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✗</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">DiffEdit</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✓</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✗</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✓</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✓</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✗</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">Pix2Pix-Zero</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✗</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✗</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✗</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✗</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✗</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">LEDITS++</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✓</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✗</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✓</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✓</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✗</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">Imagic (FT)</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✗</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✗</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✗</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✗</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✗</td>
                  </tr>
                  <tr className="bg-gray-100 border-b-2 border-gray-300 font-semibold">
                    <td className="border border-gray-300 px-4 py-2">CPAM (Ours)</td>
                    <td className="border border-gray-300 px-4 py-2 text-center text-green-600">✓</td>
                    <td className="border border-gray-300 px-4 py-2 text-center text-green-600">✓</td>
                    <td className="border border-gray-300 px-4 py-2 text-center text-green-600">✓</td>
                    <td className="border border-gray-300 px-4 py-2 text-center text-green-600">✓</td>
                    <td className="border border-gray-300 px-4 py-2 text-center text-green-600">✓</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-700 mt-4 leading-relaxed">
              CPAM is the only method that supports all five functional capabilities, demonstrating its versatility in handling diverse image editing tasks.
            </p>
          </div>

          {/* Table 2: CLIPScore and LPIPS Metrics */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 mb-12">
            <h3 className="text-xl font-semibold text-center mb-4 text-gray-800">Comparison with State-of-the-Art Methods</h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              Comparison using CLIPScore (measuring text-image alignment) and LPIPS background (evaluating background preservation). <span className="font-bold">Bold</span> indicates best scores, <span className="underline">underline</span> indicates second best.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Method</th>
                    <th className="border border-gray-300 px-4 py-2 text-center font-semibold">CLIPScore ↑</th>
                    <th className="border border-gray-300 px-4 py-2 text-center font-semibold">LPIPS (bg) ↓</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">SDEdit</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">28.19</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">0.338</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">MasaCtrl</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">28.82</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">0.223</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">PnP</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">29.03</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">0.162</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">FPE</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">29.02</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">0.152</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">DiffEdit</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">28.58</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">0.148</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">Pix2Pix-Zero</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">27.01</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">0.186</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">LEDITS++</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">28.74</td>
                    <td className="border border-gray-300 px-4 py-2 text-center"><span className="font-bold">0.141</span></td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">Imagic (FT)</td>
                    <td className="border border-gray-300 px-4 py-2 text-center"><span className="font-bold">30.34</span></td>
                    <td className="border border-gray-300 px-4 py-2 text-center">0.420</td>
                  </tr>
                  <tr className="bg-gray-100 border-b-2 border-gray-300 font-semibold">
                    <td className="border border-gray-300 px-4 py-2">CPAM (Ours)</td>
                    <td className="border border-gray-300 px-4 py-2 text-center"><span className="underline">29.26</span></td>
                    <td className="border border-gray-300 px-4 py-2 text-center"><span className="underline">0.149</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-700 mt-4 leading-relaxed">
              CPAM achieves high CLIP score alongside low structure distortion and background preservation, demonstrating superior editing capability.
            </p>
          </div>

          {/* Table 3: User Study Results */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-xl font-semibold text-center mb-4 text-gray-800">User Study Results</h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              Participants rated image editing methods on a scale of 1 (very bad) to 6 (very good). <span className="font-bold">Bold</span> indicates best scores, <span className="underline">underline</span> indicates second best.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Method</th>
                    <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Object Retention</th>
                    <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Background Retention</th>
                    <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Realistic</th>
                    <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Satisfaction</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">SDEdit</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">3.63</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">3.19</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">3.38</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">2.42</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">MasaCtrl</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">4.01</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">4.17</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">4.32</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">3.11</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">PnP</td>
                    <td className="border border-gray-300 px-4 py-2 text-center"><span className="underline">4.61</span></td>
                    <td className="border border-gray-300 px-4 py-2 text-center">4.49</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">4.20</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">2.63</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">FPE</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">4.50</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">4.44</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">4.33</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">2.53</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">DiffEdit</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">4.58</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">4.57</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">4.40</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">3.13</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">Pix2Pix-Zero</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">2.11</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">4.23</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">1.84</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">1.93</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">LEDIT++</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">4.38</td>
                    <td className="border border-gray-300 px-4 py-2 text-center"><span className="underline">4.95</span></td>
                    <td className="border border-gray-300 px-4 py-2 text-center"><span className="underline">4.57</span></td>
                    <td className="border border-gray-300 px-4 py-2 text-center">3.26</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">Imagic (FT)</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">3.74</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">3.48</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">4.30</td>
                    <td className="border border-gray-300 px-4 py-2 text-center"><span className="font-bold">4.82</span></td>
                  </tr>
                  <tr className="bg-gray-100 border-b-2 border-gray-300 font-semibold">
                    <td className="border border-gray-300 px-4 py-2">CPAM (Ours)</td>
                    <td className="border border-gray-300 px-4 py-2 text-center"><span className="font-bold">4.72</span></td>
                    <td className="border border-gray-300 px-4 py-2 text-center"><span className="font-bold">5.09</span></td>
                    <td className="border border-gray-300 px-4 py-2 text-center"><span className="font-bold">4.69</span></td>
                    <td className="border border-gray-300 px-4 py-2 text-center"><span className="underline">3.30</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-700 mt-4 leading-relaxed">
              CPAM significantly outperforms existing methods, achieving the best user satisfaction scores in object retention, background retention, and realism.
            </p>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="py-16 px-4 bg-gray-100 text-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold uppercase text-center mb-6">Demo Video</h2>
          <div className="aspect-video bg-white rounded-lg overflow-hidden relative shadow-lg">
            <video
              className="w-full h-full object-cover"
              controls
              loop
              muted
              playsInline
            >
              <source src="/demo_video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </section>

      {/* Application Section */}
      <section className="py-16 px-4 bg-white text-gray-900 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold uppercase text-center mb-6">Application</h2>

          <p className="text-lg text-gray-700 leading-relaxed mb-8 text-center max-w-4xl mx-auto">
            CPAM is designed as a general, training-free attention manipulation framework that can be instantiated across diverse image editing scenarios. 
            Below, we present representative systems that build directly on CPAM’s core mechanisms, demonstrating how its principles translate into interactive research prototypes and practical end-user applications as well as object removal and precise region-focused editing, illustrating its extensibility across problem settings.         
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* iCONTRA Card */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-2xl font-semibold text-gray-800 mb-3">iCONTRA — Interactive Concept Transfer (CHI &apos;24)</h3>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                iCONTRA further demonstrates CPAM’s applicability to concept-level consistency in creative workflows. It incorporates a CPAM-based zero-shot editing algorithm that progressively integrates visual information from initial exemplars without fine-tuning, enabling coherent concept transfer across generated items. This formulation allows designers to efficiently create high-quality, thematically consistent collections with reduced effort.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="https://dl.acm.org/doi/full/10.1145/3613905.3650788"
                  className="inline-block bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  iCONTRA Paper →
                </a>
                <div className="mt-4">
                <img src="/interface.png" alt="iCONTRA Teaser" className="w-full h-auto rounded shadow-lg" />
                </div>
              </div>
            </div>

            {/* EPEdit Card */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-2xl font-semibold text-gray-800 mb-3">EPEdit — Efficient Photo Editor</h3>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                EPEdit packages CPAM-based zero-shot editing algorithms into a practical end-user system for comprehensive photo manipulation. By leveraging CPAM’s training-free attention control, EPEdit supports a wide range of editing tasks—including object removal, replacement, pose adjustment, background modification, and thematic collection design—while maintaining efficiency, usability, and low deployment cost.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="https://link.springer.com/chapter/10.1007/978-981-96-4288-5_22"
                  className="inline-block bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  EPEdit Paper →
                </a>
              </div>
              <div className="mt-4">
                <img src="/teaser_epedit.png" alt="EPEdit Teaser" className="w-full h-auto rounded shadow-lg" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Extended Work / Related Projects */}
      <section className="py-16 px-4 bg-gray-50 text-gray-900 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* PANDORA Card */}
            <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-md">
              <h3 className="text-2xl font-semibold text-gray-800 mb-3">PANDORA — Zero-Shot Object Removal</h3>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                PANDORA represents the foundational instantiation of CPAM for prompt-free object removal. By operationalizing CPAM’s pixel-wise attention dissolution and localized attentional guidance, PANDORA enables precise, non-rigid, and scalable multi-object erasure in a single pass without fine-tuning or prompt engineering.              
              </p>
              <a
                href="https://pandora-laboratory.github.io/"
                className="inline-block bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit PANDORA →
              </a>
              <div className="mt-4">
                <img src="/teaser_Pandora.png" alt="PANDORA Project Teaser" className="w-full h-auto rounded shadow-lg" />
              </div>
            </div>

            {/* FocusDiff Card */}
            <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-md">
              <h3 className="text-2xl font-semibold text-gray-800 mb-3">FocusDiff — Target-Aware Refocusing</h3>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                Building upon the same CPAM principles, FocusDiff extends attention refocusing and preservation mechanisms to region-specific text-guided editing, addressing prompt brittleness, spillover artifacts, and failures on small or cluttered objects. CPAM’s localized preservation strategies naturally generalize to FocusDiff’s refocused cross-attention, further enabling globally consistent editing in challenging settings such as 360° indoor panoramas and virtual reality environments.              
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="#"
                  className="inline-block bg-blue-900 text-white px-5 py-2 rounded-lg font-semibold transition"
                >
                  coming soon
                </a>

              </div>
              <div className="mt-4">
                <img src="/teaser_focusdiff.png" alt="FocusDiff Teaser" className="w-full h-auto rounded shadow-lg" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* CPAM Citation */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">CPAM (2025)</h3>
              <pre className="bg-white border border-gray-300 rounded p-4 overflow-x-auto text-sm font-mono text-gray-700">
{`@article{vo2025cpam,
  title={CPAM: Context-Preserving Adaptive Manipulation for Zero-Shot Real Image Editing},
  author={Vo, Dinh-Khoi and Do, Thanh-Toan and Nguyen, Tam V and Tran, Minh-Triet and Le, Trung-Nghia},
  journal={arXiv preprint arXiv:2506.18438},
  year={2025}
}`}
              </pre>
            </div>

            {/* EPEdit Citation */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">EPEdit: Redefining Image Editing with Generative AI (2024)</h3>
              <pre className="bg-white border border-gray-300 rounded p-4 overflow-x-auto text-sm font-mono text-gray-700">
{`@inproceedings{nguyen2024epedit,
  title={EPEdit: Redefining Image Editing with Generative AI and User-Centric Design},
  author={Nguyen, Hoang-Phuc and Vo, Dinh-Khoi and Do, Trong-Le and Nguyen, Hai-Dang and Nguyen, Tan-Cong and Nguyen, Vinh-Tiep and Nguyen, Tam V and Le, Khanh-Duy and Tran, Minh-Triet and Le, Trung-Nghia},
  booktitle={International Symposium on Information and Communication Technology},
  pages={272--283},
  year={2024},
  organization={Springer}
}`}
              </pre>
            </div>

            {/* iCONTRA Citation */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">iCONTRA: Interactive Concept Transfer (CHI 2024)</h3>
              <pre className="bg-white border border-gray-300 rounded p-4 overflow-x-auto text-sm font-mono text-gray-700">
{`@inproceedings{10.1145/3613905.3650788,
author = {Vo, Dinh-Khoi and Ly, Duy-Nam and Le, Khanh-Duy and Nguyen, Tam V. and Tran, Minh-Triet and Le, Trung-Nghia},
title = {iCONTRA: Toward Thematic Collection Design Via Interactive Concept Transfer},
year = {2024},
isbn = {9798400703317},
publisher = {Association for Computing Machinery},
address = {New York, NY, USA},
url = {https://doi.org/10.1145/3613905.3650788},
doi = {10.1145/3613905.3650788},
abstract = {Creating thematic collections in industries demands innovative designs and cohesive concepts. Designers may face challenges in maintaining thematic consistency when drawing inspiration from existing objects, landscapes, or artifacts. While AI-powered graphic design tools offer help, they often fail to generate cohesive sets based on specific thematic concepts. In response, we introduce iCONTRA, an interactive CONcept TRAnsfer system. With a user-friendly interface, iCONTRA enables both experienced designers and novices to effortlessly explore creative design concepts and efficiently generate thematic collections. We also propose a zero-shot image editing algorithm, eliminating the need for fine-tuning models, which gradually integrates information from initial objects, ensuring consistency in the generation process without influencing the background. A pilot study suggests iCONTRA&apos;s potential to reduce designers&apos; efforts. Experimental results demonstrate its effectiveness in producing consistent and high-quality object concept transfers. iCONTRA stands as a promising tool for innovation and creative exploration in thematic collection design. The source code will be available at: https://github.com/vdkhoi20/iCONTRA.},
booktitle = {Extended Abstracts of the CHI Conference on Human Factors in Computing Systems},
articleno = {382},
numpages = {8},
keywords = {Diffusion model, Thematic collection design, Zero-shot image editing},
location = {Honolulu, HI, USA},
series = {CHI EA '24}
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Acknowledgment Section */}
      <section className="py-16 px-4 bg-gray-50 text-gray-900 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold uppercase text-center mb-6">Acknowledgment</h2>
          <div className="flex-1">
            {/* Funding and GPU Support */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">💰</span>
                <h3 className="text-xl font-semibold text-amber-900">Funding and GPU Support</h3>
              </div>
              <p className="text-lg leading-relaxed text-amber-800">
                This research is funded by the Vietnam National Foundation for Science and Technology Development (NAFOSTED) under Grant Number 102.05-2023.31. This research used the GPUs provided by the Intelligent Systems Lab at the Faculty of Information Technology, University of Science, VNU-HCM.
              </p>
            </div>

            {/* User Study Participants */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🙏</span>
                <h3 className="text-xl font-semibold text-blue-900">User Study Participants</h3>
              </div>
              <p className="text-lg leading-relaxed text-blue-800">
                We extend our heartfelt gratitude to all 20 participants who took part in our comprehensive user study. Your valuable time, thoughtful feedback, and detailed evaluations across 50 randomly shuffled images were instrumental in validating the effectiveness and usability of our CPAM framework. Your insights helped us understand the practical impact of our zero-shot real image editing approach and provided crucial evidence of its superiority over existing state-of-the-art methods.
              </p>
            </div>

            {/* Website Design Credit */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🎨</span>
                <h3 className="text-xl font-semibold text-green-900">Website Design Inspiration</h3>
              </div>
              <p className="text-lg leading-relaxed text-green-800">
                This website design is inspired by{" "}
                <a
                  href="https://objectdrop.github.io/"
                  className="text-blue-600 hover:underline font-semibold"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ObjectDrop
                </a>. We thank the authors for their excellent work and creative design approach.
              </p>
            </div>

  
          </div>
        </div>
      </section>
    </div>
  );
}
