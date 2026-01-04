import { FaExclamationTriangle, FaShieldAlt, FaInfoCircle } from 'react-icons/fa';

const RulesAndServices = () => {
  return (
    <section className="mt-4 sm:mt-5 md:mt-7 p-4 sm:p-5 md:p-6 rounded-[16px] sm:rounded-[20px] md:rounded-[24px] bg-gradient-to-br from-purple-50 via-violet-50/50 to-fuchsia-50 border-2 border-purple-200/60 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-5 sm:mb-6">
        <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg">
          <FaShieldAlt className="text-white text-xl sm:text-2xl" />
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
          নিয়মাবলী ও সেবা
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Rule 1 */}
        <div className="flex items-start gap-3 p-4 sm:p-5 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-red-300/50 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
          <div className="flex-shrink-0 p-2 rounded-lg bg-red-100">
            <FaExclamationTriangle className="text-red-600 text-lg sm:text-xl" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm sm:text-base font-bold text-red-900 mb-2">
              UID ভুল দেওয়ার দায়িত্ব
            </h3>
            <p className="text-xs sm:text-sm text-red-800 leading-relaxed">
              যদি কেউ ভুল UID দেয়, তাহলে আমাদের কোনো দায়িত্ব থাকবে না। দয়া করে টপ-আপ করার আগে UID সঠিকভাবে চেক করে নিন।
            </p>
          </div>
        </div>

        {/* Rule 2 */}
        <div className="flex items-start gap-3 p-4 sm:p-5 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-blue-300/50 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
          <div className="flex-shrink-0 p-2 rounded-lg bg-blue-100">
            <FaInfoCircle className="text-blue-600 text-lg sm:text-xl" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm sm:text-base font-bold text-blue-900 mb-2">
              সমস্যা হলে যোগাযোগ করুন
            </h3>
            <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
              কোনো সমস্যা হলে বা সাহায্যের প্রয়োজন হলে, নিচের WhatsApp আইকনে ক্লিক করে আমাদের সাথে সরাসরি যোগাযোগ করুন। আমরা যত দ্রুত সম্ভব আপনার সমস্যা সমাধান করার চেষ্টা করব।
            </p>
          </div>
        </div>

        {/* Rule 3 */}
        <div className="flex items-start gap-3 p-4 sm:p-5 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-green-300/50 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
          <div className="flex-shrink-0 p-2 rounded-lg bg-green-100">
            <FaShieldAlt className="text-green-600 text-lg sm:text-xl" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm sm:text-base font-bold text-green-900 mb-2">
              নিরাপদ পেমেন্ট
            </h3>
            <p className="text-xs sm:text-sm text-green-800 leading-relaxed">
              আমাদের সব পেমেন্ট সিস্টেম সম্পূর্ণ নিরাপদ এবং সুরক্ষিত। আপনার ব্যক্তিগত তথ্য কখনোই শেয়ার করা হবে না।
            </p>
          </div>
        </div>

        {/* Rule 4 */}
        <div className="flex items-start gap-3 p-4 sm:p-5 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-purple-300/50 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
          <div className="flex-shrink-0 p-2 rounded-lg bg-purple-100">
            <FaInfoCircle className="text-purple-600 text-lg sm:text-xl" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm sm:text-base font-bold text-purple-900 mb-2">
              দ্রুত ডেলিভারি
            </h3>
            <p className="text-xs sm:text-sm text-purple-800 leading-relaxed">
              আমাদের AI-চালিত সিস্টেমের মাধ্যমে আপনি পাবেন ⚡ তাৎক্ষণিক প্রসেসিং এবং 📦 দ্রুত ও নির্ভুল ডেলিভারি।
            </p>
          </div>
        </div>

        {/* Rule 5 - Age Restriction */}
        <div className="flex items-start gap-3 p-4 sm:p-5 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-orange-300/50 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
          <div className="flex-shrink-0 p-2 rounded-lg bg-orange-100">
            <FaExclamationTriangle className="text-orange-600 text-lg sm:text-xl" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm sm:text-base font-bold text-orange-900 mb-2">
              বয়স সীমাবদ্ধতা
            </h3>
            <p className="text-xs sm:text-sm text-orange-800 leading-relaxed">
              ১৮ বছরের নিচে কেউ top up করতে পারবে না। আমাদের সেবা শুধুমাত্র ১৮ বছর বা তার বেশি বয়সের ব্যবহারকারীদের জন্য।
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 sm:mt-6 p-4 sm:p-5 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 border-2 border-purple-400 shadow-lg">
        <p className="text-sm sm:text-base text-white text-center font-semibold">
          <span className="text-lg sm:text-xl mr-2">💬</span>
          WhatsApp-এ যোগাযোগ: কোনো প্রশ্ন বা সমস্যা থাকলে নিচের WhatsApp বাটনে ক্লিক করুন
        </p>
      </div>
    </section>
  );
};

export default RulesAndServices;

