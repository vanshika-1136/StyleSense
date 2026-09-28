function LearningSection() {
  const steps = [
    {
      icon: '👀',
      title: 'You browse',
      text: 'Every interaction gives StyleSense a signal.',
    },
    {
      icon: '♡',
      title: 'You interact',
      text: 'Clicks, wishlist and cart actions reveal intent.',
    },
    {
      icon: '🧠',
      title: 'AI learns',
      text: 'Your behavior builds a dynamic preference profile.',
    },
    {
      icon: '✨',
      title: 'Feed adapts',
      text: 'Future searches become more personalized.',
    },
  ];

  return (
    <section
      className="
            bg-black
            text-white
            py-24
        "
    >
      <div
        className="
                max-w-7xl
                mx-auto
                px-6
            "
      >
        <div className="max-w-2xl mb-14">
          <p
            className="
                        text-gray-500
                        text-sm
                        uppercase
                        tracking-widest
                    "
          >
            How it works
          </p>

          <h2
            className="
                        text-4xl
                        md:text-5xl
                        font-bold
                        mt-3
                    "
          >
            Your actions
            <br />
            shape your feed.
          </h2>

          <p
            className="
                        text-gray-400
                        mt-5
                        text-lg
                    "
          >
            StyleSense doesn't ask you to fill out a preference form. It learns
            from your behavior.
          </p>
        </div>

        <div
          className="
                    grid
                    md:grid-cols-4
                    gap-5
                "
        >
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="
                                rounded-2xl
                                border
                                border-gray-800
                                p-6
                                hover:border-gray-500
                                transition
                            "
            >
              <div className="text-3xl mb-8">{step.icon}</div>

              <span
                className="
                                text-xs
                                text-gray-600
                            "
              >
                0{index + 1}
              </span>

              <h3
                className="
                                text-lg
                                font-semibold
                                mt-2
                            "
              >
                {step.title}
              </h3>

              <p
                className="
                                text-sm
                                text-gray-500
                                mt-3
                                leading-relaxed
                            "
              >
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default LearningSection;
