
export default function Test() {
  return (
    <>
      <div className="grid place-items-center p-8 text-4xl">
        <h3>CAREER RECOMMEND</h3>
      </div>
      <div className="w-full max-w-[80%] h-[80vh] border border-white/10 bg-white/5 flex flex-col rounded-xl mx-auto">
        <div className="grid h-full md:grid-cols-2 gap-4 m-5 place-items-center">
          <div className="w-full h-full bg-white/10 rounded-lg">
            <h1 className="grid place-items-center p-8 text-3xl">TRAIT</h1>

          </div>
          <div className="w-full h-full bg-white/10 rounded-lg">
            <h1 className="grid place-items-center p-8 text-3xl">CAREER FOR YOU</h1>
            <div className="">

            </div>
          </div>
        </div>
      </div>
    </>
  );
}