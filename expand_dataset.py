import pandas as pd

spam = [
        # OTP / Bank
    "Your bank account has been flagged. Tell me the OTP you received to verify your identity.",
    "We detected a suspicious transaction. Please read the OTP sent to your phone so I can cancel it.",
    "Your account will be blocked unless you provide the OTP we just sent you.",
    "I am calling from your bank security team. Please share the OTP to confirm this transaction.",
    "Your KYC verification is incomplete. Give me the OTP you received to complete it.",
    "Your debit card will be blocked today. Tell me the verification OTP to keep it active.",
    "We need your OTP to process your refund. Please read the code to me.",
    "Your bank account has suspicious activity. Share the OTP so we can secure your account.",
    "I am from customer support. Please provide the OTP sent to your phone so I can verify your account.",
    "Your credit card has been selected for an upgrade. Tell me the OTP to activate it.",
    "Your loan application requires OTP verification. Please give me the OTP over the phone.",
    "Your account verification is pending. Share the OTP and we will complete it for you.",
    "We have sent an OTP to cancel the unauthorized payment. Please tell me the code.",
    "Your SIM will be blocked today. Give me the OTP to complete your SIM verification.",
    "Your mobile number needs urgent verification. Please read the OTP to me.",
    "Your bank account will be frozen unless you confirm the OTP immediately.",
    "We are processing your lottery winnings. Tell us the OTP to release the money.",
    "You have won a prize. Provide the OTP sent to your phone to claim your reward.",
    "Your delivery payment failed. Tell me the OTP so I can complete the payment for you.",
    "Your refund is ready. Please provide the OTP received on your phone to receive the money.",

    # Lottery / Prize
    "Congratulations! You have won a lottery prize of 50 lakh rupees. Pay the processing fee to claim your prize.",
    "You are the lucky winner of our international lottery. Send your bank details to receive the money.",
    "Congratulations, you won a billion dollar lottery! Contact us immediately to claim your prize.",
    "Your mobile number has been selected for a cash prize. Pay the registration fee to receive it.",

    # Fake Customer Support
    "Hello, I am calling from customer support. We noticed a problem with your account. Please install this application so I can help you.",
    "Your online banking account has a security problem. Give me remote access to your computer so I can fix it.",
    "We are calling from technical support. Please download this remote access application and share the access code.",

    # Loan / Credit Card
    "You have been approved for a personal loan of 10 lakh rupees. Pay a small processing fee to release the amount.",
    "Congratulations, you are eligible for a premium credit card. Please provide your bank details to complete the application.",
    "Your instant loan is ready. Send the verification fee and your account information to receive the money.",

    # Job Scams
    "You have been selected for a work from home job earning 5000 rupees per day. Pay the registration fee to start.",
    "Congratulations, your job application has been approved. Send your identity documents and processing fee.",
    "We have a high paying online job for you. First pay the security deposit to activate your account.",

    # Investment / Crypto
    "Our investment platform can double your money in seven days. Transfer money to our account to start investing.",
    "You have been selected for a special cryptocurrency investment opportunity. Send the initial investment today.",
    "Invest 10000 rupees with us and receive guaranteed returns of 50000 rupees.",

    # Delivery scams
    "Your package is stuck because of an unpaid customs fee. Pay the charge using this link to receive your delivery.",
    "We are calling about your delivery. Please provide your card details to pay the small delivery fee.",
    "Your parcel could not be delivered. Pay the redelivery charge immediately to avoid returning the package.",

    # SIM / Government
    "Your SIM card will be permanently blocked today because your documents are not verified. Provide your Aadhaar details immediately.",
    "This is a call from the government department. Your number has been involved in illegal activity. Pay the verification fee to avoid action.",
    "Your SIM verification has failed. Share the OTP sent to your phone to prevent your number from being disconnected.",
]

normal = [
    # Bank
    "Hello, this is your bank calling to confirm your appointment at the branch tomorrow.",
    "We are calling from the bank to inform you that your new debit card is ready for collection.",
    "Your bank statement is available. You can download it from the official banking application.",
    "We are calling to confirm the date and time of your scheduled bank appointment.",
    
    # Legitimate OTP usage
    "Your bank has sent an OTP to your registered phone. Enter it yourself in the official banking app to continue.",
    "An OTP has been sent to your mobile number. Enter the code on the official website to verify your login.",
    "Please use the OTP sent to your phone to complete your online banking login.",
    "Your OTP is required to confirm your login. Enter it in the banking application.",
    "We have sent a verification OTP to your registered mobile number. Enter it on the official website.",
    "Use the OTP you received to confirm your appointment through our official application.",
    "An OTP has been sent to verify your phone number. Enter it in the app to continue.",
    "Please enter the OTP received on your registered number to complete the signup process.",
    "Your OTP will expire shortly. Enter it on the official payment page to continue.",
    "We sent an OTP to confirm your email address. Enter the code in the application.",
    "Enter the OTP sent to your phone to confirm your delivery address.",
    "Your OTP is required to verify your identity on the official customer portal.",
    "Please enter the one-time password on the official website to complete your account verification.",
    "An OTP has been sent to confirm your password reset. Enter it yourself on the official website.",
    "Use the OTP from your phone to complete the secure login process.",
    "Your bank has sent an OTP for login verification. Please enter it in the banking app.",
    "Enter the OTP received on your registered number to confirm the transaction.",
    "A verification code has been sent to your phone. Enter it on the official application.",
    "Please use the OTP to verify your mobile number during registration.",
    "The OTP is required to confirm your appointment booking. Enter it in the official app.",

    # Delivery
    "Hello, I am calling from the delivery service. Your package will arrive tomorrow afternoon.",
    "Your delivery driver is nearby and will reach your address in approximately ten minutes.",
    "We are calling to confirm your delivery address for the package you ordered.",
    "Your package has been shipped and is expected to arrive on Friday.",

    # Appointments
    "Hello, this is a reminder that you have a doctor's appointment tomorrow at 10 AM.",
    "We are calling to confirm your appointment for next Monday.",
    "Your service appointment has been scheduled for Thursday afternoon.",
    "This is a reminder about your scheduled meeting at 3 PM tomorrow.",

    # Customer Service
    "Hello, we are calling to follow up on your recent customer service request.",
    "Your support ticket has been updated and our team will contact you shortly.",
    "We are calling to confirm that your replacement product has been shipped.",
    "Your refund has been processed and should appear in your account shortly.",

    # Jobs
    "Hello, we are calling regarding your job application. Are you available for an interview tomorrow?",
    "Your interview has been scheduled for Monday at 11 AM.",
    "We received your application and would like to discuss the position with you.",
    "We are calling to confirm your availability for the interview next week.",
]

df = pd.DataFrame({
    "conversation": spam + normal,
    "label": [1] * len(spam) + [0] * len(normal)
})

df.to_csv("expanded_calls.csv", index=False)

print(f"Created {len(df)} new conversations.")
print(df["label"].value_counts())