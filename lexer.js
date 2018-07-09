var BabyMLLexer = function() {
    this.tokens = []
};

BabyMLLexer.prototype.paren_tokenize = function(text, paren_index) {
    let paren_num = 1;
    let start_idx = paren_index;
    let end_idx = -1;
    for(var i=paren_index+1;i<text.length;i++){
        // Open paren, update start index to i
        if(text[i] == '(') {
            paren_num++;
        }
        else if(text[i] == ')') {
            // Reduce paren num
            paren_num--;
            // Found the longest closing bracket for now, tokenize it recursive
            if(paren_num == 0) {
                end_idx = i-1;
                // Take body and create paren type
                const body = text.slice(start_idx, end_idx);
                paren = new Parenthesised(body);
                paren.start_idx = start_idx-1;
                paren.end_idx = end_idx+1;
                return paren;
            }
        }
    }

    return null;
}

BabyMLLexer.prototype.fun_tokenize = function(text, start_idx) {
    // Read until next space to get the arg
    const current_arg = ""
    let j=start_idx+4;
    for(;j<text.length;j++) {
        if(text[j] === ' '){
            break;
        }
        current_arg += text[j];
    }
    if(text[j+1] == '-' && text[j+2] == '>' && text[j+3] == ' ') {
        // Take the body and create a fun object, recurse on the body
        body = text.slice(j+4);
        fun = new Lambda(new ID(current_arg), body);
        fun.start_idx = start_idx;
        fun.end = text.length-1;
        fun.children.push(fun.variable);
        return fun;
    }

    return null;
}

BabyMLLexer.prototype.let_tokenize = function(text, space_idx, is_rec){
    let start_idx = space_idx-3;
    let i = space_idx+1;
    const let_token = is_rec ? ' letrec ' : ' let ';
    const in_token = ' in ';
    if(is_rec){
        start_idx -= 3;
    }

    // Read the ID literal
    let id_literal = '';
    for(;i<text.length;i++) {
        if(text[i] === ' '){
            break;
        }
        id_literal += text[i]
    }

    if(text[i+1] === '=' && text[i+2] === ' ') {
        i += 3;
        let start_def_func_idx = i;
        let end_def_func_idx = -1;
        let current_txt = "";
        let let_amount = 1;
        for(;i<text.length;i++) {
            if(current_txt === let_token) {
                let_amount++;
                current_txt = '';
            }
            else if(current_txt === in_token) {
                let_amount--;
                if(let_amount == 0) {
                    // Found the right in
                    end_def_func_idx = i-4;
                    const def_func_text = text.slice(start_def_func_idx, end_def_func_idx);
                    const body = text.slice(i);
                    const let_obj = is_rec ? new RecursiveLet(new ID(id_literal), def_func_text, body) : 
                                         new Let(new ID(id_literal), def_func_text, body);
                    let_obj.start_idx = start_idx;
                    let_obj.end_idx = text.length-1;
                    let.children.push(let.variable);
                    return let_obj;
                }
            }
        }
    }

    return null;
}

BabyMLLexer.prototype.pair_tokenize = function(text, space_idx) {
    const start_idx = space_idx - 4;
    let mid_idx = -1;
    let end_idx = -1;
    let i = space_idx+1;
    let current_txt = "";
    let pair_amount = 1;
    let paren_amount = 1;
    let pair_mid_found = false;
    for(;i<text.length;i++) {
        if(current_txt === ' pair ') {
            pair_amount++;
            current_txt = '';
        }
        else if(text[i] === '(') {
            paren_amount++;
            current_txt = '';
        }
        else if(text[i] === ')') {
            paren_amount--;
            current_txt = '';
            if(paren_amount == 0 && pair_mid_found){
                // Found end, finish here
                end_idx = i;
                let t2_start_idx = -1;
                const t1 = text.slice(start_idx+1, mid_idx-1);
                // Move from mid_idx+1 until something that isnt space is found
                for(let j=mid_idx+1;j<end_idx;j++) {
                    if(text[j] != ' ') {
                        t2_start_idx = j;
                        break;
                    }
                }

                const t2 = text.slice(t2_start_idx, end_idx-1);
                const pair = new Pair(t1, t2);
                pair.start_idx = start_idx;
                pair.end_idx = end_idx;
                return pair;
            }
            else if(paren_amount == 0) {
                // Error
                return null;
            }
        }
        else if(text[i] === ',') {
            pair_amount--;
            current_txt = '';
            if(pair_amount == 0) {
                // Mid found here, save it
                mid_idx = i-1;
                pair_mid_found = true;
            }
        }
    }
}

BabyMLLexer.prototype.funcapp_tokenize = function(text, func_def, space_idx) {
    const arg = text.slice(space_idx+1);
    let funcapp = new FunctionApp(func_def, arg);
    funcapp.start_idx = space_idx-func_def.length-1;
    funcapp.end_idx = text.length-1;
    return funcapp;
}

BabyMLLexer.prototype.literal_tokenize = function(literal, start_idx) {
    let obj = null;
    if(literal === 'true' || literal === 'false') {
        obj = new Boolean(literal === 'true');
    }
    else {
        let num = parseInt(literal);
        if(!isNaN(num)) {
            obj = new Number(num);
        }
        else {
            obj = new ID(literal);
        }
    }

    return obj;
}

BabyMLLexer.prototype.tokenize = function(text, parent_object) {
    let current_txt = "";
    let obj = null;
    for(var i=0;i<text.length;i++) {
        const c = text[i];
        if(c === '(') {
            obj = this.paren_tokenize(text, i);
            if(obj == null) {
                throw new DOMException('Invalid text, paren error');
            }
            this.tokenize(obj.paren_body, obj);
        }
        else if(current_txt === 'fun' && c === ' ') {
            obj = this.fun_tokenize(text, i-3);
            if(obj == null) {
                throw new DOMException('Invalid text, fun error');
            }
            this.tokenize(obj.body, obj);
        }
        else if((current_txt === 'let' || current_txt === 'letrec') && c === ' '){
            obj = this.let_tokenize(text, i, current_txt === 'letrec');
            if(obj == null) {
                throw new DOMException('Invalid text, let/letrec error');
            }
            this.tokenize(obj.def_func, obj);
            this.tokenize(obj.body, obj);
        }
        else if(c === ' ') {
            // Function app
            if(current_txt === 'pair') {
                obj = this.pair_tokenize(text, i);
                if(obj == null) {
                    throw new DOMException('Invalid text, pair error');
                }
                this.tokenize(obj.t1, obj);
                this.tokenize(obj.t2, obj);
            } else {
                // Check if there is body
                if(i+1 == text.length) {
                    obj = this.literal_tokenize(current_txt, i-current_txt.length-1)
                    if(obj == null) {
                        throw new DOMException('Invalid text, literal error');
                    }
                }
                else {
                    obj = this.funcapp_tokenize(text, current_txt, i);
                    if(obj == null) {
                        throw new DOMException('Invalid text, funcapp error');
                    }
                    this.tokenize(obj.func, obj);
                    this.tokenize(obj.arg, obj);
                }
            }
        }
        else {
            current_txt += c;
            continue;
        }

        if(parent_object != null) {
            parent_object.children.push(obj);
        }
        else {
            this.tokens.push(obj);
        }

        i = obj.end_idx+1;
        current_txt = "";
    }
    
    if(current_txt != "") {
        obj = this.literal_tokenize(current_txt, text.length-current_txt.length-1)
        if(obj == null) {
            throw new DOMException('Invalid text, literal error');
        }

        if(parent_object != null) {
            parent_object.children.push(obj);
        }
        else {
            this.tokens.push(obj);
        }
    }
};
















// IDLiteral: sex, (sex) ...
// BooleanLiteral: true, (false)
// IntLiteral: 5, (5)
// Lambda: (fun {v} -> {body})
// FunctionApp: ({fn} {arg})
// Let: (let {v} = {defn} in {body})
// Letrec: (letrec {v} = {defn} in {body})

// The flow is as follows:
// - Start by checking if the string starts with [fun, let, letre, (defined_func_apps)]
// - For fun:
//  - longest fun <V> -> <B> (literal to body, easily handled with regex)
// - For let / letrec:
//  - longest let <V> = <DEF> in <BODY> (Same as paren handling)
// - For funcapp:
//  - Only handled recursivly when no other choice
// Algo:
// - Check starting token
//  - If (:
//    - Find end paren
//    - Recurisve treat body
//  - If fun:
//     - Read arg
//     - Ignore -> (Assert for error handling)
//     - Read body as the rest of the text and recursivly handling the body (Call the same function)
//  - Else If Let/LetRec:
//     - Read ID literal
//     - Ignore = (Assert for error handling)
//     - Read until the first in where let count is 0 - This is the def func, recursive handle
//     - Ignore in
//     - Read body as the rest of the text and recursivly handling the body (Call the same function)
//  - Else functionapp:
//     - Read id
//     - If pair
//       - Find first , where pair count is 0
//       - First part is t1, second part is t2, recursive on both (and remove parenthesis)
//     - Read body and parse recursive
//       - If no body, this is a literal, parse either integer or boolean or id 

// const test = 'let x = 7 in (fun kill -> (plus 2 5)) x'
function clickme() {
    text = document.getElementById("text_to_parse").value;
    console.log(text);
    ml = new BabyMLLexer();
    ml.tokenize(text);
    console.log(ml.tokens);
}



const test2 = '(fun g -> let f = fun x -> x in pair (f 3, f true))'
const test3 = 'let x = fun y -> z y in x 5'
const test4 = 'plus 5 3'