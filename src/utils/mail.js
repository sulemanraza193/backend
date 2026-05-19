import Mailgen from "mailgen"
import nodemailer from "nodemailer"

const sendEmail = async (options) => {
    const mailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: "Task manager",
            link: "http/.www.exmple.com"
        }
    });

    const mailTextual = mailGenerator.generatePlaintext(options.mailgenContent);
    const mailHtml = mailGenerator.generate(options.mailgenContent);

    const transpoter = nodemailer.createTransport({
        host: process.env.MAILTRAP_SMTP_HOST,
        port: Number(process.env.MAILTRAP_SMTP_PORT),
        secure: false,
        auth: {
            user: process.env.MAILTRAP_SMTP_USER,
            pass: process.env.MAILTRAP_SMTP_PASS,
        }
    });

    const mailOptions = {
        from: "razasalman77@gmail.com",
        to: options.email,
        subject: options.subject,
        text: mailTextual,
        html: mailHtml,
    };

    try {
        await transpoter.sendMail(mailOptions);
    } catch (error) {
        console.log("EMAIL ERROR:", error);
        throw error;
    }
}


const emailVerificationMailgenContent = (username, verificationUrl) => {
    return {
        body: {
            name: username,
            intro: "Welcome to our App! We are excited to have you on board.",
            action: {
                instruction: "To verify your email, click the following button:",
                button: {
                    color: "#22BC66",
                    text: "Verify your email",
                    link: verificationUrl,
                },
            },
            outro: "If you did not create an account, no further action is required.",
        },
    };
};

const forgotPasswordMailgenContent = (username, resetUrl) => {
    return {
        body: {
            name: username,
            intro: "You have requested to reset your password.",
            action: {
                instruction: "To reset your password, click the following button:",
                button: {
                    color: "#FF6136",
                    text: "Reset your password",
                    link: resetUrl,
                },
            },
            outro: "If you did not request a password reset, no further action is required.",
        }
    }
}

export { emailVerificationMailgenContent, forgotPasswordMailgenContent, sendEmail }