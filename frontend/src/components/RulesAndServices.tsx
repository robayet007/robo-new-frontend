import { FaExclamationTriangle, FaShieldAlt, FaInfoCircle } from 'react-icons/fa';

const RulesAndServices = () => {
  return (
    <section className="mt-4 sm:mt-5 md:mt-7 p-3 sm:p-4 md:p-6 rounded-[12px] sm:rounded-[16px] md:rounded-[18px] bg-white border border-slate-900/6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
        <FaShieldAlt className="text-xl sm:text-2xl text-purple-600" />
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">
          নিয়মাবলী ও সেবা
        </h2>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {/* Rule 1 */}
        <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-red-50 border border-red-200">
          <FaExclamationTriangle className="flex-shrink-0 text-red-600 text-lg sm:text-xl mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm sm:text-base font-semibold text-red-900 mb-1">
              UID ভুল দেওয়ার দায়িত্ব
            </h3>
            <p className="text-xs sm:text-sm text-red-800 leading-relaxed">
              যদি কেউ ভুল UID দেয়, তাহলে আমাদের কোনো দায়িত্ব থাকবে না। দয়া করে টপ-আপ করার আগে UID সঠিকভাবে চেক করে নিন।
            </p>
          </div>
        </div>

        {/* Rule 2 */}
        <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-blue-50 border border-blue-200">
          <FaInfoCircle className="flex-shrink-0 text-blue-600 text-lg sm:text-xl mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm sm:text-base font-semibold text-blue-900 mb-1">
              সমস্যা হলে যোগাযোগ করুন
            </h3>
            <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
              কোনো সমস্যা হলে বা সাহায্যের প্রয়োজন হলে, নিচের WhatsApp আইকনে ক্লিক করে আমাদের সাথে সরাসরি যোগাযোগ করুন। আমরা যত দ্রুত সম্ভব আপনার সমস্যা সমাধান করার চেষ্টা করব।
            </p>
          </div>
        </div>

        {/* Rule 3 */}
        <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-green-50 border border-green-200">
          <FaShieldAlt className="flex-shrink-0 text-green-600 text-lg sm:text-xl mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm sm:text-base font-semibold text-green-900 mb-1">
              নিরাপদ পেমেন্ট
            </h3>
            <p className="text-xs sm:text-sm text-green-800 leading-relaxed">
              আমাদের সব পেমেন্ট সিস্টেম সম্পূর্ণ নিরাপদ এবং সুরক্ষিত। আপনার ব্যক্তিগত তথ্য কখনোই শেয়ার করা হবে না।
            </p>
          </div>
        </div>

        {/* Rule 4 */}
        <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-purple-50 border border-purple-200">
          <FaInfoCircle className="flex-shrink-0 text-purple-600 text-lg sm:text-xl mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm sm:text-base font-semibold text-purple-900 mb-1">
              দ্রুত ডেলিভারি
            </h3>
            <p className="text-xs sm:text-sm text-purple-800 leading-relaxed">
              আমাদের AI-চালিত সিস্টেমের মাধ্যমে আপনি পাবেন ⚡ তাৎক্ষণিক প্রসেসিং এবং 📦 দ্রুত ও নির্ভুল ডেলিভারি।
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 sm:mt-5 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200">
        <p className="text-xs sm:text-sm text-slate-700 text-center">
          <span className="font-semibold">💬 WhatsApp-এ যোগাযোগ:</span> কোনো প্রশ্ন বা সমস্যা থাকলে নিচের WhatsApp বাটনে ক্লিক করুন
        </p>
      </div>
    </section>
  );
};

export default RulesAndServices;

