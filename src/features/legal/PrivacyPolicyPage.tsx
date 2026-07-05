const CONTACT_EMAIL = 'mhd7190@gmail.com';
const LAST_UPDATED = '11 يونيو 2026';

const SECTIONS = [
  {
    title: '1. من نحن',
    body: (
      <p>
        تطبيق <strong>الوسيط العقاري</strong> منصة عقارية تتيح للمستخدمين تصفّح العقارات،
        نشر الإعلانات، والتواصل مع الوسطاء والمعلنين. للاستفسارات المتعلقة بالخصوصية
        يمكنك التواصل معنا عبر البريد:{' '}
        <a className="text-teal-600 underline" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
      </p>
    ),
  },
  {
    title: '2. البيانات التي نجمعها',
    body: (
      <ul className="list-disc pr-5 space-y-1">
        <li>
          <strong>بيانات الحساب:</strong> الاسم، رقم الهاتف، البريد الإلكتروني (إن وُجد)،
          وكلمة المرور (مخزّنة بشكل مشفّر).
        </li>
        <li>
          <strong>بيانات الملف الشخصي:</strong> صورة الملف الشخصي (إن رفعتها).
        </li>
        <li>
          <strong>بيانات العقارات:</strong> تفاصيل الإعلانات، الصور، الفيديوهات، الموقع
          (المدينة/المنطقة)، ووسائل التواصل المرتبطة بالإعلان.
        </li>
        <li>
          <strong>بيانات الاستخدام:</strong> الطلبات العقارية، المفضّلة، الإبلاغات، وآخر
          ظهور للحساب.
        </li>
        <li>
          <strong>بيانات الجهاز:</strong> معرّف الجهاز، نوع الجهاز، وتوكن الإشعارات.
        </li>
        <li>
          <strong>بيانات تقنية:</strong> معلومات التطبيق عند تسجيل الدخول لأغراض الأمان.
        </li>
      </ul>
    ),
  },
  {
    title: '3. كيف نستخدم بياناتك',
    body: (
      <ul className="list-disc pr-5 space-y-1">
        <li>إنشاء حسابك وتسجيل دخولك وإدارة جلستك.</li>
        <li>عرض ونشر الإعلانات العقارية والطلبات.</li>
        <li>تمكين التواصل بين المستخدمين والوسطاء.</li>
        <li>إرسال إشعارات مهمة عن الإعلانات والطلبات.</li>
        <li>تحسين أمان المنصة ومنع إساءة الاستخدام.</li>
      </ul>
    ),
  },
  {
    title: '4. مشاركة البيانات',
    body: (
      <>
        <p className="mb-2">لا نبيع بياناتك الشخصية. قد نشارك البيانات في الحالات التالية فقط:</p>
        <ul className="list-disc pr-5 space-y-1">
          <li>
            <strong>مع مزوّدي الخدمة:</strong> لاستضافة البيانات، تخزين الوسائط، وإرسال
            الإشعارات (مثل Supabase وFirebase Cloud Messaging).
          </li>
          <li>
            <strong>مع مستخدمين آخرين:</strong> عند نشر إعلان أو طلب، تظهر بيانات التواصل
            التي تختار مشاركتها.
          </li>
          <li>
            <strong>لأسباب قانونية:</strong> عند طلب جهة مختصة وفق الأنظمة المعمول بها.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: '5. تخزين البيانات والأمان',
    body: (
      <p>
        نخزّن البيانات على خوادم آمنة ونطبّق إجراءات تقنية لحمايتها، بما في ذلك تشفير
        كلمات المرور واستخدام اتصالات آمنة (HTTPS).
      </p>
    ),
  },
  {
    title: '6. حقوقك',
    body: (
      <ul className="list-disc pr-5 space-y-1">
        <li>الاطلاع على بياناتك وتحديثها من داخل التطبيق.</li>
        <li>طلب تصحيح أو حذف بياناتك عبر التواصل معنا.</li>
        <li>إلغاء الاشتراك في الإشعارات من إعدادات الجهاز أو التطبيق.</li>
      </ul>
    ),
  },
  {
    title: '7. خصوصية الأطفال',
    body: (
      <p>
        التطبيق غير موجّه للأطفال دون 13 عامًا ولا نجمع عن قصد بيانات منهم.
      </p>
    ),
  },
  {
    title: '8. التواصل معنا',
    body: (
      <p>
        لأي استفسار حول الخصوصية، راسلنا على:{' '}
        <a className="text-teal-600 underline" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
      </p>
    ),
  },
] as const;

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-2xl px-5 py-10">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-teal-700">سياسة الخصوصية</h1>
          <p className="mt-2 text-sm text-slate-500">
            تطبيق <strong>الوسيط العقاري</strong> — آخر تحديث: {LAST_UPDATED}
          </p>
          <p className="mt-6 leading-7">
            نحن في تطبيق <strong>الوسيط العقاري</strong> نحترم خصوصيتك ونلتزم بحماية بياناتك
            الشخصية. توضّح هذه السياسة نوع البيانات التي نجمعها وكيف نستخدمها.
          </p>
          {SECTIONS.map((section) => (
            <section key={section.title} className="mt-6">
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <div className="mt-2 leading-7 text-slate-800">{section.body}</div>
            </section>
          ))}
          <footer className="mt-8 border-t border-slate-200 pt-4 text-sm text-slate-500">
            © الوسيط العقاري — جميع الحقوق محفوظة
          </footer>
        </article>
      </div>
    </div>
  );
}
