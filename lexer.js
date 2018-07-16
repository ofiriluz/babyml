types = require('./types')

var BabyMLLexer = function() {
    this.tokens = []
};

BabyMLLexer.prototype.paren_tokenize = function(text, paren_index) {
    let paren_num = 1;
    let start_idx = paren_index+1;
    let end_idx = -1;
    console.log(text.slice(paren_index));
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
                end_idx = i;
                // Take body and create paren type
                const body = text.slice(start_idx, end_idx);
                paren = new types.Parenthesised(body);
                paren.start_idx = start_idx-1;
                paren.end_idx = end_idx;

                return paren;
            }
        }
    }

    return null;
}

BabyMLLexer.prototype.fun_tokenize = function(text, space_idx, current_global_index) {
    // Read until next space to get the arg
    let current_arg = ""
    let j = space_idx+1;
    for(;j<text.length;j++) {
        if(text[j] === ' '){
            break;
        }
        current_arg += text[j];
    }
    
    if(text[j+1] == '-' && text[j+2] == '>' && text[j+3] == ' ') {
        // Take the body and create a fun object, recurse on the body
        body = text.slice(j+4);
        fun = new types.Lambda(new types.ID(current_arg), body);
        fun.start_idx = space_idx-3;
        fun.end_idx = text.length;
        fun.variable.start_idx = space_idx+1 + current_global_index;
        fun.variable.end_idx = fun.variable.start_idx + current_arg.length
        fun.children.push(fun.variable);
        return fun;
    }

    return null;
}

BabyMLLexer.prototype.let_tokenize = function(text, space_idx, is_rec, current_global_index){
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
            if(current_txt.includes(let_token)) {
                let_amount++;
                current_txt = '';
            }
            else if(current_txt.includes(in_token)) {
                let_amount--;
                if(let_amount == 0) {
                    // Found the right in
                    end_def_func_idx = i-4;
                    const def_func_text = text.slice(start_def_func_idx, end_def_func_idx);
                    const body = text.slice(i);
                    const let_obj = is_rec ? new types.RecursiveLet(new types.ID(id_literal), def_func_text, body) : 
                                         new types.Let(new types.ID(id_literal), def_func_text, body);
                    let_obj.start_idx = start_idx;
                    let_obj.end_idx = text.length;
                    let_obj.variable.start_idx = current_global_index + (is_rec ? start_idx + 7 : start_idx + 4);
                    let_obj.variable.end_idx = let_obj.variable.start_idx + let_obj.variable.id.length;
                    let_obj.children.push(let_obj.variable);
                    return let_obj;
                }
            }
            else {
                current_txt += text[i];
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
    let paren_amount = 0;
    let pair_mid_found = false;
    for(;i<text.length;i++) {
        if(current_txt.includes(' pair ')) {
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
                const t1 = text.slice(space_idx+2, mid_idx);
                // Move from mid_idx+1 until something that isnt space is found
                for(let j=mid_idx+1;j<end_idx;j++) {
                    if(text[j] != ' ') {
                        t2_start_idx = j;
                        break;
                    }
                }

                const t2 = text.slice(t2_start_idx, end_idx);
                const pair = new types.Pair(t1.trim(), t2.trim());
                pair.start_idx = start_idx;
                pair.end_idx = end_idx+1;
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
                mid_idx = i;
                pair_mid_found = true;
            }
        }
        else {
            current_txt += text[i];
        }
    }
}

BabyMLLexer.prototype.funcapp_tokenize = function(text, func_def, space_idx) {
    const arg = text.slice(space_idx+1);
    let funcapp = new types.FunctionApp(func_def, arg);
    funcapp.start_idx = space_idx-func_def.length;
    funcapp.end_idx = text.length;
    return funcapp;
}

BabyMLLexer.prototype.literal_tokenize = function(literal, start_idx) {
    let obj = null;
    if(literal === 'true' || literal === 'false') {
        obj = new types.Boolean(literal === 'true');
    }
    else {
        let num = parseInt(literal);
        if(!isNaN(num)) {
            obj = new types.Number(num);
        }
        else {
            obj = new types.ID(literal);
        }
    }
    obj.start_idx = start_idx;
    obj.end_idx = start_idx + literal.length
    return obj;
}

BabyMLLexer.prototype.tokenize = function(text, parent_object, current_global_index) {
    let current_txt = "";
    let obj = null;
    for(var i=0;i<text.length;i++) {
        const c = text[i];
        if(c === '(') {
            obj = this.paren_tokenize(text, i);
            if(obj == null) {
                throw new Error('Invalid text, paren error');
            }
            this.tokenize(obj.paren_body, obj, current_global_index+1);
        }
        else if(current_txt === 'fun' && c === ' ') {
            obj = this.fun_tokenize(text, i, current_global_index);
            if(obj == null) {
                throw new Error('Invalid text, fun error');
            }
            this.tokenize(obj.body, obj, current_global_index+9);
        }
        else if((current_txt === 'let' || current_txt === 'letrec') && c === ' '){
            is_let_rec =  current_txt === 'letrec';
            obj = this.let_tokenize(text, i, is_let_rec, current_global_index);
            if(obj == null) {
                throw new Error('Invalid text, let/letrec error');
            }
            const var_len = obj.variable.id.length;
            const let_len = is_let_rec ? 7 : 4
            this.tokenize(obj.def_func, obj, current_global_index + let_len + var_len + 3);
            this.tokenize(obj.body, obj, current_global_index + let_len + 1 + var_len + 3 + obj.def_func.length + 3);
        }
        else if(c === ' ') {
            // Function app
            if(current_txt === 'pair') {
                obj = this.pair_tokenize(text, i);
                if(obj == null) {
                    throw new Error('Invalid text, pair error');
                }
                this.tokenize(obj.t1, obj, current_global_index+6);
                this.tokenize(obj.t2, obj, current_global_index + (obj.end_idx - obj.start_idx)-obj.t2.length-1);
            } else {
                // Check if there is body
                if(i+1 == text.length) {
                    obj = this.literal_tokenize(current_txt, i-current_txt.length)
                    if(obj == null) {
                        throw new Error('Invalid text, literal error');
                    }
                }
                else {
                    obj = this.funcapp_tokenize(text, current_txt, i);
                    if(obj == null) {
                        throw new Error('Invalid text, funcapp error');
                    }
                    this.tokenize(obj.func, obj, current_global_index);
                    this.tokenize(obj.arg, obj, current_global_index + obj.func.length + 1);
                }
            }
        }
        else {
            current_txt += c;
            continue;
        }

        obj.start_idx += current_global_index;
        obj.end_idx += current_global_index;
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
        obj = this.literal_tokenize(current_txt, text.length-current_txt.length)
        if(obj == null) {
            throw new Error('Invalid text, literal error');
        }
        obj.start_idx += current_global_index;
        obj.end_idx += current_global_index;
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

var print_indices = function(tokens, text) {
    for(var i=0;i<tokens.length;i++){
        console.log(tokens[i].start_idx + "-" + tokens[i].end_idx + "-" + text.slice(tokens[i].start_idx, tokens[i].end_idx));
        print_indices(tokens[i].children, text);
    }
}


const test2 = '(fun g -> let f = fun x -> x in pair (f 3, f true))'
const test3 = 'let x = fun y -> z y in x 5'
const test4 = 'plus 5 3'

babyml = new BabyMLLexer();
babyml.tokenize(test2, null, 0);
console.log(JSON.stringify(babyml.tokens, null, 4));
print_indices(babyml.tokens, test2);