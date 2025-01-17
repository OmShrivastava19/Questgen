from flask import Flask, render_template, request, redirect
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///quest.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class Quest(db.Model):
    sno = db.Column(db.Integer, primary_key=True)
    standard = db.Column(db.Integer, nullable=False)
    subject = db.Column(db.String(100), nullable=False)
    chapter = db.Column(db.String(100), nullable=False)
    topic = db.Column(db.String(100), nullable=False)
    question = db.Column(db.String(200), nullable=False)
    diff = db.Column(db.String(200), nullable=False)
    answer = db.Column(db.String(200), nullable=False)

    def __repr__(self) -> str:
        return f"{self.sno} - {self.subject} - {self.chapter} - {self.topic} - {self.question} - {self.diff} - {self.answer}"

@app.route('/quest', methods=['GET', 'POST'])
def hello_world():
    if request.method == 'POST':
        standard = request.form['standard']
        subject = request.form['subject']
        chapter = request.form['chapter']
        topic = request.form['topic']
        question = request.form['question']
        diff = request.form['diff']
        answer = request.form['answer']
        entry = Quest(standard=standard, subject=subject, chapter=chapter, topic=topic, question=question, diff=diff, answer=answer)
        db.session.add(entry)
        db.session.commit()
    
    allQuest = Quest.query.all()
    return render_template('add_quest.html', allQuest=allQuest)

@app.route('/')
def homepage():
    allQuest = Quest.query.all()
    return render_template('index.html', allQuest=allQuest)

@app.route('/delete/<int:sno>')
def delete(sno):
    quest = Quest.query.filter_by(sno=sno).first()
    db.session.delete(quest)
    db.session.commit()
    return redirect("/browse")

@app.route('/quest')
def quest():
    allQuest = Quest.query.all()
    return render_template('quest.html', allQuest=allQuest)

@app.route('/browse')
def browse():
    allQuest = Quest.query.all()
    return render_template('all_quest.html', allQuest=allQuest)

@app.route('/about')
def about():
    return render_template('about.html')

# @app.route('/update/<int:sno>', methods=['GET', 'POST'])
# def update(sno):
#     if request.method=='POST':
#         title = request.form['title']
#         desc = request.form['desc']
#         quest = quest.query.filter_by(sno=sno).first()
#         todo.title = title
#         quest.desc = desc
#         db.session.add(quest)
#         db.session.commit()
#         return redirect("/")
        
#     todo = Todo.query.filter_by(sno=sno).first()
#     return render_template('update.html', todo=todo)

# @app.route('/addquest')
# def addquest():
#     return render_template('addquest.html')

# @app.route('/viewquest')
# def viewquest():
#     return render_template('viewquest.html')

# @app.route('/editquest')
# def editquest():
#     return render_template('editquest.html')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  
    app.run(debug=True, port=5000)

